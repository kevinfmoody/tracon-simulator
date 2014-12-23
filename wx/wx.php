<?php

$baseURL = 'http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi';
$requestData = [
  'service'=> 'WMS',
  'request'=> 'GetMap',
  'version'=> '1.1.1',
  'format'=> 'svg',
  'width'=> 2048,
  'height'=> 2048,
  'SRS'=> 'EPSG:4326',
  'bbox'=> @$_GET['bbox'],
  'layers'=> 'nexrad-n0q-conus'
];


copy($baseURL . '?' . http_build_query($requestData), 'wx.svg');