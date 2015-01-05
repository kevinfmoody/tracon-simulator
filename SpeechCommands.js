function SpeechCommands() {
  if (annyang) {
    annyang.processSpeechWith(this.processSpeech.bind(this), this.aggregateCommands.bind(this), this.selectCommands.bind(this));
    annyang.debug();
    annyang.start();
  }

  this._pushToTalkDown = false;
  this._lastReleased = 0;
}

SpeechCommands.NUMBERS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine'
];

SpeechCommands.PHONETIC = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'niner'
];

SpeechCommands.NUMERIC = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'tree': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'niner': 9,
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17
};

SpeechCommands.TYPE = {
  HEADING: 1,
  ALTITUDE: 2,
  SPEED: 3,
  AIRCRAFT: 4
};

SpeechCommands.prototype.transmit = function() {
  this._pushToTalkDown = true;
};

SpeechCommands.prototype.release = function() {
  this._pushToTalkDown = false;
  this._lastReleased = new Date().getTime();
};

SpeechCommands.prototype.processSpeech = function(speech) {
  var commands = [
    this.headingCommand(speech),
    this.altitudeCommand(speech)
  ].concat(this.callsignDetection(speech)).filter(function(c) {
    return c !== null;
  });
  return commands;
};

SpeechCommands.prototype.aggregateCommands = function(oldCommands, newCommands) {
  newCommands.forEach(function(c) {
    if (oldCommands[c.type])
      oldCommands[c.type].push(c);
    else
      oldCommands[c.type] = [c];
  });
};

SpeechCommands.prototype.selectCommands = function(candidateCommands) {
  var commands = {};
  for (var type in SpeechCommands.TYPE) {
    var cType = SpeechCommands.TYPE[type];
    if (candidateCommands[cType]) {
      var command = {};
      candidateCommands[cType].forEach(function(c) {
        for (var k in c) {
          if (!command[k])
            command[k] = {};
          if (command[k][c[k]])
            command[k][c[k]]++;
          else
            command[k][c[k]] = 1;
        }
      });
      for (var ck in command) {
        var max = 0;
        var argmax = '';
        for (var i in command[ck]) {
          if (command[ck][i] > max && i !== '') {
            max = command[ck][i];
            argmax = i;
          }
        }
        command[ck] = argmax;
      }
      commands[command.type] = command;
    }
  }
  //if (this._pushToTalkDown || new Date().getTime() - this._lastReleased < 10 * 1000)
    this.acknowledgeCommands(commands);
};

SpeechCommands.prototype.acknowledgeCommands = function(commands) {
  if (commands[SpeechCommands.TYPE.AIRCRAFT]) {
    var response = '',
        rbStyle = Math.random(),
        voices = speechSynthesis.getVoices(),
        voice = voices[1],
        command = commands[SpeechCommands.TYPE.AIRCRAFT],
        airline = command.callsign.substr(0, 3),
        numbers = command.callsign.substr(3),
        callsign = scope.targetManager().getCallsignByAirline(airline).toLowerCase(),
        target = scope.targetManager().getTargetByCallsign(command.callsign),
        numAssignments = 0;

    if (!target)
      return;

    if (commands[SpeechCommands.TYPE.HEADING]) {
      numAssignments++;
      command = commands[SpeechCommands.TYPE.HEADING];
      setTimeout(function() {
        target.assignHeading(command.heading);
      }, 5 * 1000 + Math.random() * 3 * 1000);
      if (rbStyle < 0.2) {
        response += command.direction ? command.direction : 'turn';
        response += ' to ';
        response += Math.random() < 0.7 ? this.spreadNumeric(this.pad(command.heading)) : this.splitNumeric(this.pad(command.heading));
      } else if (rbStyle < 0.8) {
        response += command.direction ? 'turn ' + command.direction : 'fly';
        response += ' heading ';
        response += this.spreadNumeric(this.pad(command.heading));
      } else {
        response += Math.random() < 0.7 ? this.splitNumeric(this.pad(command.heading)) : this.spreadNumeric(this.pad(command.heading));
        response += ' on the heading';
      }
      response += ', ';
    }

    if (commands[SpeechCommands.TYPE.ALTITUDE]) {
      numAssignments++;
      var intermediate = '';
      command = commands[SpeechCommands.TYPE.ALTITUDE];
      setTimeout(function() {
        target.assignAltitude(command.altitude);
      }, 5 * 1000 + Math.random() * 3 * 1000);
      if (rbStyle < 0.2) {
        intermediate += Math.random() < 0.8 ? 'down to ' : 'descend and maintain ';
        intermediate += command.altitude;
      } else if (rbStyle < 0.8) {
        intermediate += 'descend and maintain ';
        intermediate += command.altitude;
      } else {
        intermediate += Math.random() < 0.8 ? 'down to ' : 'descend and maintain ';
        intermediate += command.altitude;
      }
      intermediate += ', ';
      if (Math.random() < 0.7)
        response += intermediate;
      else
        response = intermediate + response;
    }

    if (numAssignments === 0) {
      if (rbStyle < 0.2) {
        response += 'say again for ';
      } else if (rbStyle < 0.8) {
        response += 'repeat last transmission for ';
      } else {
        response += 'say again for ';
      }
    }

    response += callsign + ' ';
    response += this.splitNumeric(numbers);

    if (airline === 'AFR')
      voice = voices[4];
    else if (airline === 'BAW')
      voice = this.isMale(target.callsign()) ? voices[1] : voices[2];
    else if (!this.isMale(target.callsign()))
      voice = voices[0];

    response += '.';
    console.log(response);
    var acknowledgement = new SpeechSynthesisUtterance(response);
    acknowledgement.voice = voice;
    speechSynthesis.speak(acknowledgement);
  }
};

SpeechCommands.prototype.isMale = function(callsign) {
  var sum = 0;
  callsign.split('').forEach(function(digit) {
    sum += parseInt(digit, 10);
  });
  return sum % 9 !== 0;
};

SpeechCommands.prototype.pad = function(number) {
  if (parseInt(number, 10) < 100)
    return '0' + number;
  return number;
};

SpeechCommands.prototype.spreadNumeric = function(number) {
  return ('' + number).split('').map(function(num) {
    return SpeechCommands.PHONETIC[num];
  }).join(' ');
};

SpeechCommands.prototype.splitNumeric = function(number) {
  var str = '' + number,
      len = str.length;
  if (len > 2)
    return str.substr(0, len - 2) + ' ' + str.substr(len - 2);
  return str;
};

SpeechCommands.prototype.headingCommand = function(speech) {
  var result = new RegExp('(fly|turn|left|right|heading)[^0-9]*?(to |2){0,1}[^0-9]*?([0-3]|to |two )[^0-9]*?([0-9]|92|98)[^0-9]*?0', 'i').exec(speech);
  if (!result)
    result = new RegExp('( )()([0-3]|to |two )[^0-9]*?([0-9]|92|98)[^0-9]*?0([^0]|$)', 'i').exec(speech);
  if (result) {
    var dir = speech.indexOf('left') >= 0 ? 'left' : (speech.indexOf('right') >= 0 ? 'right' : '');
    var firstDigit = parseInt(result[3], 10);
    if (isNaN(firstDigit))
      firstDigit = 2;
    var secondDigit = parseInt(result[4], 10);
    if (secondDigit === 92 || secondDigit === 98)
      secondDigit = 9;
    return {
      type: SpeechCommands.TYPE.HEADING,
      heading: parseInt('' + firstDigit + secondDigit + '0', 10),
      direction: dir
    };
  }
  return null;
};

SpeechCommands.prototype.altitudeCommand = function(speech) {
  var result = new RegExp('(((one|1)[^0-9]{0,1})|)([0-9]|(' + Object.keys(SpeechCommands.NUMERIC).join('|') + '))((( thousand|000)(( (5|five) hundred)| 500|))|000|500)', 'i').exec(speech);
  if (result) {
    var altitude = 0;
    if (result[6] === '500' || result[9] === ' 500' || result[11] !== undefined)
      altitude += 500;
    var digits = '';
    if (result[3] !== undefined)
      digits += isNaN(parseInt(result[3], 10)) ? SpeechCommands.NUMERIC[result[3]] : result[3];
    digits += isNaN(parseInt(result[4], 10)) ? SpeechCommands.NUMERIC[result[4]] : result[4];
    altitude += parseInt(digits, 10) * 1000;
    return {
      type: SpeechCommands.TYPE.ALTITUDE,
      altitude: altitude
    };
  }
  return null;
};

SpeechCommands.prototype.callsignDetection = function(speech) {
  var targetManager = scope.targetManager(),
      result = new RegExp('(' + targetManager.callsigns().join('|') + '|)[^0-9]*?([0-9]{1,4})', 'i').exec(speech);
  if (result) {
    var callsign = result[1].toUpperCase(),
        numbers = result[2],
        airline = result[1] ? targetManager.getAirlineByCallsign(callsign) : '',
        targets = airline ? targetManager.getOwnedTargetsByAirline(airline) : targetManager.getAllOwnedTargets(),
        min = 5,
        argmin = [];
    for (var i in targets) {
      var targetCallsign = targets[i].callsign(),
          targetNumbers = targetCallsign.substr(3),
          editDistance = this.editDistance(targetNumbers, numbers);
      if (editDistance < min && editDistance < targetNumbers.length) {
        min = editDistance;
        argmin = [targetCallsign];
      } else if (editDistance === min) {
        argmin.push(targetCallsign);
      }
    }
    return argmin.map(function(targetCallsign) {
      return {
        type: SpeechCommands.TYPE.AIRCRAFT,
        callsign: targetCallsign
      };
    }.bind(this));
  }
  return [null];
};

SpeechCommands.prototype.editDistance = function(a, b) {
  if (a.length === 0)
    return b.length;
  if (b.length === 0)
    return a.length;
 
  var matrix = [];
 
  for (var i = 0; i <= b.length; i++)
    matrix[i] = [i];
  for (var j = 0; j <= a.length; j++)
    matrix[0][j] = j;
 
  for (i = 1; i <= b.length; i++)
    for (j = 1; j <= a.length; j++)
      if (b.charAt(i-1) === a.charAt(j-1))
        matrix[i][j] = matrix[i-1][j-1];
      else
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
 
  return matrix[b.length][a.length];
};