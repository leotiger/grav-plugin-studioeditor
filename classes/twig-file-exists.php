<?php

/*
 * This file is a Twig extension.
 *
 * (c) 2016 Uli Hake
 *
 */

class Twig_File_Exists extends Twig_Extension
{
    public function __construct()
    {
    }
    /**
     * Return the functions registered as twig extensions
     * 
     * @return array
     */
    public function getFunctions()
    {
        return array(
            new Twig_SimpleFunction('file_exists', 'file_exists'),
        );
    }

    public function getName()
    {
        return 'file_exists';
    }
}
