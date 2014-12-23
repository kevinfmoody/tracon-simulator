<?php

ini_set('memory_limit', -1);
set_time_limit(0);
$n = 16;

class Point {
  public $row = 0;
  public $col = 0;

  function __construct($row, $col) {
    $this->row = $row;
    $this->col = $col;
  }

  public function isValid() {
    global $n;
    return $this->row >= 0 && $this->col >= 0 && $this->row < 2048 / $n && $this->col < 2048 / $n;
  }

  public function val(&$grid) {
    return $grid[$this->row][$this->col];
  }

  public function prominentNeighborType(&$grid) {
    $precips = [];
    $type = $this->val($grid);
    for ($i = 0; $i < 8; $i++) {
      $pt = $this->pointInDirection($i);
      if ($pt->isValid()) {
        $precip = $pt->val($grid);
        if ($precip > 0)
          $precips[$precip]++;
      }
    }
    asort($precips);
    $keys = array_keys($precips);
    return count($keys) > 0 && $precips[$keys[0]] > 1 ? $keys[0] : 0;
  }

  public function countNeighborsOfType(&$grid, $type = NULL) {
    $neighbors = 0;
    $type = $type !== NULL ? $type : $this->val($grid);
    for ($i = 0; $i < 8; $i++) {
      $pt = $this->pointInDirection($i);
      if ($pt->isValid() && $pt->val($grid) === $type)
        $neighbors++;
    }
    return $neighbors;
  }

  public function pointInDirection($direction) {
    $dr = 0;
    $dc = 0;
    if ($direction % 2 == 0) {
      $dr = -cos($direction * pi() / 4);
      $dc = sin($direction * pi() / 4);
    } else {
      $dc = 1 - 2 * floor($direction / 4);
      $dr = $direction % 4 == 1 ? -$dc : $dc;
    }
    return new Point(round($this->row + $dr), round($this->col + $dc));
  }
}

function deNoiseGrid(&$grid) {
  global $n;
  $contourGrid = [];
  for ($row = 0; $row < 2048 / $n; $row++) {
    $contourGridRow = [];
    for ($col = 0; $col < 2048 / $n; $col++) {
      $pt = new Point($row, $col);
      if ($pt->countNeighborsOfType($grid) > 1)
        $contourGridRow[$col] = $pt->val($grid);
      else
        $contourGridRow[$col] = $pt->prominentNeighborType($grid);
    }
    $contourGrid[] = $contourGridRow;
  }
  return $contourGrid;
}

function outlineGrid(&$grid) {
  global $n;
  $contourGrid = [];
  for ($row = 0; $row < 2048 / $n; $row++) {
    $contourGridRow = [];
    for ($col = 0; $col < 2048 / $n; $col++) {
      $pt = new Point($row, $col);
      if ($pt->countNeighborsOfType($grid) != 8)
        $contourGridRow[$col] = $pt->val($grid);
    }
    $contourGrid[] = $contourGridRow;
  }
  return $contourGrid;
}

function detectEdges(&$grid) {
  $dir = 2;

}

function truemod($num, $mod) {
  return ($mod + ($num % $mod)) % $mod;
}

function crawlEdge(&$grid, &$edgeGrid, $start) {
  $front = [
    [-1, -1], [-1, 0],
    [-1, 0], [0, 0],
    [0, 0], [0, -1],
    [0, -1], [-1, -1]
  ];
  $used = [
    [0, 0],
    [0, -1],
    [-1, -1],
    [-1, 0]
  ];
  $dir = 2;
  $val = $start->val($grid);
  $border = [$val, $start];
  $pt = $start->pointInDirection($dir);
  $border[] = $pt;
  while ($pt != $start) {
    $edgeGrid[$pt->row + $used[$dir / 2][0]][$pt->col + $used[$dir / 2][1]] = $val;
    $fl = new Point($pt->row + $front[$dir][0], $pt->col + $front[$dir][1]);
    $fr = new Point($pt->row + $front[truemod(($dir + 1), 8)][0], $pt->col + $front[truemod(($dir + 1), 8)][1]);
    if (!$fr->isValid($grid) || $fr->val($grid) != $val) {
      $dir = truemod(($dir + 2), 8);
      $pt = $pt->pointInDirection($dir);
      $border[] = $pt;
    } else if ($fl->isValid($grid) && $fl->val($grid) == $val) {
      $dir = truemod(($dir - 2), 8);
      $pt = $pt->pointInDirection($dir);
      $border[] = $pt;
    } else {
      $pt = $pt->pointInDirection($dir);
      $border[] = $pt;
    }
  }
  return $border;
}

function isValidEdgeStart(&$grid, &$edgeGrid, &$pt) {
  $val = $pt->val($grid);
  if ($pt->val($edgeGrid) != 0)
    return false;
  $delta = [
    [0, -1],
    [-1, -1],
    [-1, 0],
    [-1, 1]
  ];
  for ($i = 0; $i < 4; $i++) {
    $p = new Point($pt->row + $delta[$i][0], $pt->col + $delta[$i][1]);
    if ($p->isValid($grid) && $p->val($grid) == $val && ($i % 2 == 0 || $p->val($contourGrid) != 0))
      return false;
  }
  return true;
}

function gridToContour(&$grid) {
  global $n;
  $edgeGrid = [[]];
  $borders = [];
  $bc = 0;
  for ($row = 0; $row < 2048 / $n; $row++) {
    for ($col = 0; $col < 2048 / $n; $col++) {
      $pt = new Point($row, $col);
      if (isValidEdgeStart($grid, $edgeGrid, $pt)) {
        $borders[] = crawlEdge($grid, $edgeGrid, $pt);
        $bc++;
        if ($bc == @$_GET['i']) {
          drawRegions($borders);
          die();
        }
      }
    }
  }
  drawRegions($borders);
  die();
  return $contourGrid;
}

function drawRegions(&$borders) {
  global $n;
  $dim = 1024 / (2048 / $n);
?>

<canvas id="regions" width="1024px" height="1024px"></canvas>

<script type="text/javascript">

var canvas = document.getElementById('regions');
var context = canvas.getContext('2d');

var paths = <?=json_encode($borders)?>;


var colors = ['white', 'lightblue', 'blue', 'lightgreen', 'green', 'yellow', 'red'];

function drawNext(p) {
  var precip = paths[p][0];
  context.beginPath();
  context.moveTo(paths[p][1].col * <?=$dim?>, paths[p][1].row * <?=$dim?>);
  for (var i = 2; i < paths[p].length; i++) {
    context.lineTo(paths[p][i].col * <?=$dim?>, paths[p][i].row * <?=$dim?>);
  }
  context.fillStyle = colors[precip];
  context.strokeStyle = 'black';
  context.lineWidth = 2;
  context.fill();
  context.stroke();

  setTimeout(function() {
    drawNext(p + 1);
  }, 1000 / 5);
}
drawNext(0);

</script>
<?php
}

function crawlBorderRecursively(&$contourGrid, &$grid, &$start, $pt, $dir) {
  if ($pt == NULL) {
    for ($i = 2; $i < 6; $i++) {
      $pt = $start->pointInDirection($i);
      if ($pt->isValid($grid) && $pt->val($grid) == 3) {
        $contourGrid[$pt->row][$pt->col] = 6;
        crawlBorderRecursively($contourGrid, $grid, $start, $pt, $i);
        return;
      }
    }
  } else if ($pt == $start) {

  } else {
    $bdir = $dir + 5;
    $bdirb = $bdir + 8;
    for ($i = $bdir; $i < $bdirb; $i++) {
      $next = $pt->pointInDirection($i % 8);
      if ($next->isValid($grid) && $next->val($grid) == 3) {
        $contourGrid[$next->row][$next->col] = 6;
        crawlBorderRecursively($contourGrid, $grid, $start, $next, $i % 8);
        return;
      }
    }
  }
}

function crawlBorderIteratively(&$contourGrid, &$grid, &$start, $val) {
  $border = [];
  $border[] = [$start->row, $start->col];
  //echo $start->row . ' ' . $start->col . '<br>';
  for ($dir = 2; $dir < 6; $dir++) {
    $pt = $start->pointInDirection($dir);
    if ($pt->isValid($grid) && $pt->val($grid) == $val) {
      $contourGrid[$pt->row][$pt->col] = $val;
      $border[] = [$pt->row, $pt->col];
      //echo $pt->row . ' ' . $pt->col . '<br>';
      while ($pt != $start) {
        $bdir = $dir + 5;
        $bdirb = $bdir + 8;
        for ($i = $bdir; $i < $bdirb; $i++) {
          $next = $pt->pointInDirection($i % 8);
          if ($next->isValid($grid) && $next->val($grid) == $val) {
            $contourGrid[$next->row][$next->col] = $val;
            $border[] = [$next->row, $next->col];
            //echo $next->row . ' ' . $next->col . '<br>';
            $pt = $next;
            $dir = $i;
            break;
          }
        }
      }
      return $border;
    }
  }
}

function imageToPrecipitationGrid($filename) {
  global $n;
  $im = imagecreatefromgif($filename);
  $pGrid = [];
  for ($row = 0; $row < 2048; $row += $n)
  {
    $pGridRow = [];
    for ($col = 0; $col < 2048; $col += $n)
    {
      $rgb = imagecolorat($im, $col, $row);
      $rgba = imagecolorsforindex($im, $rgb);
      $r = $rgba['red'];
      $g = $rgba['green'];
      $b = $rgba['blue'];
      $precipLevel = 0;
      if ($r < $b && $g < $b && abs($r - $g) < 50)
        $precipLevel = 1;
      else if ($r < $g && $r < $b && abs($g - $b) < 100)
        $precipLevel = 2;
      else if ($r < $g && $g > $b && abs($r - $b) < 50)
        $precipLevel = 3;
      else if ($g > $b && abs($r - $g) < 50)
        $precipLevel = 4;
      else if ($r > $b && $g > 50 && abs($g - $b) > 50)
        $precipLevel = 5;
      else if ($r > $b && $r > $g && abs($g - $b) < 50)
        $precipLevel = 6;
      $pGridRow[] = $precipLevel; 
    }
    $pGrid[] = $pGridRow;
  }
  return $pGrid;
}

$start = microtime(true);

$grid = imageToPrecipitationGrid('wx2.gif');

$nr = @$_GET['nr'] ? @$_GET['nr'] : 0;
for ($i = 0; $i < $nr; $i++) {
  $grid = deNoiseGrid($grid);
}

//$grid = gridToContour($grid);

//echo (microtime(true) - $start) / $nr;
//echo microtime() - $start;
//die();

$dim = 1024 / (2048 / $n);

?>

<canvas id="regions" width="1024px" height="1024px"></canvas>

<script type="text/javascript">

var canvas = document.getElementById('regions');
var context = canvas.getContext('2d');

var colors = ['white', 'lightblue', 'blue', 'lightgreen', 'green', 'yellow', 'red'];

var grid = <?=json_encode($grid)?>;
var dim = <?=$dim?>;

for (var r = 0; r < 2048 / <?=$n?>; r++) {
  for (var c = 0; c < 2048 / <?=$n?>; c++) {
    var color = colors[grid[r][c]];
    context.beginPath();
    context.fillStyle = color;
    context.fillRect(c * dim, r * dim, dim, dim);
  }
}

</script>