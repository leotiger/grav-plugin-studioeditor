<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit086b120d5fc8fc0b26d174a416094eb9
{
    public static $prefixLengthsPsr4 = array (
        'G' => 
        array (
            'Grav\\Plugin\\Studioeditor\\' => 25,
            'Grav\\Plugin\\Console\\' => 20,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'Grav\\Plugin\\Studioeditor\\' => 
        array (
            0 => __DIR__ . '/../..' . '/classes',
        ),
        'Grav\\Plugin\\Console\\' => 
        array (
            0 => __DIR__ . '/../..' . '/cli',
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
        'Grav\\Plugin\\StudioEditorPlugin' => __DIR__ . '/../..' . '/studioeditor.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInit086b120d5fc8fc0b26d174a416094eb9::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInit086b120d5fc8fc0b26d174a416094eb9::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInit086b120d5fc8fc0b26d174a416094eb9::$classMap;

        }, null, ClassLoader::class);
    }
}