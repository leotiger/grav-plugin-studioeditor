<?php

/*
 * This file is a Twig extension.
 *
 * (c) 2016 Uli Hake
 *
 */

class Twig_Url_Exists extends Twig_Extension
{
    public function __construct()
    {
    }
    /**
     * Return the functions registered as twig extensions
     * 
     * @return array
     */
    public function getName()
    {
        return 'checkUrl';
    }

    public function getFunctions()
    {
        return array(
            new Twig_SimpleFunction('checkUrl', array($this, 'checkUrl')),
        );
    }

    public function checkUrl($url)
    {
        $headers=get_headers($url);
        if (stripos($headers[0], "200 OK") !== false ) {
            return TRUE;
        }
        else {
            return FALSE;
        }
    }
}
