<?php
namespace Grav\Plugin;

interface ResizeImageAdapterInterface
{
    public function __construct($source);

    public function resize($width, $height);

    public function getFormat();

    public function setQuality($quality);

    public function save($filename);
}
