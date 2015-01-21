#!/bin/bash

cat ../feeds/rwtraffic.js \
    ../feeds/flow.js \
    ../latlon.js \
    ../bdffont.js \
    ../weatheroverlay.js \
    ../facilities/airport.js \
    ../facilities/runway.js \
    ../FacilityManager.js \
    ../compass.js \
    ../controller.js \
    ../conflictdetectionengine.js \
    ../crda.js \
    ../CRDAManager.js \
    ../map.js \
    ../textoverlay.js \
    ../PathManager.js \
    ../Path.js \
    ../radar.js \
    ../target.js \
    ../targetmanager.js \
    ../scope.js \
    ../SmartMap.js \
    ../renderer.js \
    ../renderers/TargetRenderer.js \
    ../renderers/PathRenderer.js \
    ../keyboard.js \
    ../command.js \
    ../ConnectionDelegate.js \
    ../main.js | uglifyjs -e -c -m toplevel > ../sim.min.js