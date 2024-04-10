<?php
namespace Grav\Plugin;

use DateTime;
use Grav\Common\Data;
use Grav\Common\File\CompiledYamlFile;
use Grav\Common\GPM\GPM;
use Grav\Common\GPM\Licenses;
use Grav\Common\GPM\Response;
use Grav\Common\Grav;
use Grav\Common\Language\LanguageCodes;
use Grav\Common\Page\Page;
use Grav\Common\Page\Pages;
use Grav\Common\Plugins;
use Grav\Common\Themes;
use Grav\Common\Uri;
use Grav\Common\User\User;
use Grav\Common\Utils;
use RocketTheme\Toolbox\Event\Event;
use RocketTheme\Toolbox\File\File;
use RocketTheme\Toolbox\File\JsonFile;
use RocketTheme\Toolbox\ResourceLocator\UniformResourceIterator;
use RocketTheme\Toolbox\ResourceLocator\UniformResourceLocator;
use RocketTheme\Toolbox\Session\Message;
use RocketTheme\Toolbox\Session\Session;
use Symfony\Component\Yaml\Yaml;
use Composer\Semver\Semver;
use PicoFeed\Reader\Reader;

class StudioEditor
{
    /**
     * @var Grav
     */
    public $grav;
  
    /**
     * @var Data\Blueprints
     */
    protected $blueprints;

    /**
     * Constructor.
     *
     * @param Grav   $grav
     * @param string $base
     * @param string $location
     * @param string $route
     */
    public function __construct(Grav $grav)
    {
      $this->grav = $grav;      
    }

    /**
     * Returns blueprints for the given type.
     *
     * @param string $type
     *
     * @return Data\Blueprint
     */
    public function blueprints($type)
    {
        if ($this->blueprints === null) {
            $this->blueprints = new Data\Blueprints('blueprints://');
        }
        return $this->blueprints->get($type);
    }
    
    /**
     * Gets configuration data.
     *
     * @param string $type
     * @param array  $post
     *
     * @return Data\Data|null
     * @throws \RuntimeException
     */
    public function data($type, array $post = [])
    {
        static $data = [];

        if (isset($data[$type])) {
            return $data[$type];
        }

        if (!$post) {
            $post = isset($_POST['data']) ? $_POST['data'] : [];
        }

        // Check to see if a data type is plugin-provided, before looking into core ones
        $event = $this->grav->fireEvent('onAdminData', new Event(['type' => &$type]));
        if ($event && isset($event['data_type'])) {
            return $event['data_type'];
        }

        /** @var UniformResourceLocator $locator */
        $locator = $this->grav['locator'];
        $filename = $locator->findResource("config://{$type}.yaml", true, true);
        $file = CompiledYamlFile::instance($filename);

        if (preg_match('|plugins/|', $type)) {
            /** @var Plugins $plugins */
            $plugins = $this->grav['plugins'];
            $obj = $plugins->get(preg_replace('|plugins/|', '', $type));

            if (!$obj) {
                return [];
            }

            $obj->merge($post);
            $obj->file($file);

            $data[$type] = $obj;
        } elseif (preg_match('|themes/|', $type)) {
            /** @var Themes $themes */
            $themes = $this->grav['themes'];
            $obj = $themes->get(preg_replace('|themes/|', '', $type));

            if (!$obj) {
                return [];
            }

            $obj->merge($post);
            $obj->file($file);

            $data[$type] = $obj;
        } elseif (preg_match('|users/|', $type)) {
            $obj = User::load(preg_replace('|users/|', '', $type));
            $obj->merge($post);

            $data[$type] = $obj;
        } elseif (preg_match('|user/|', $type)) {
            $obj = User::load(preg_replace('|user/|', '', $type));
            $obj->merge($post);

            $data[$type] = $obj;
        } elseif (preg_match('|config/|', $type)) {
            $type = preg_replace('|config/|', '', $type);
            $blueprints = $this->blueprints("config/{$type}");
            $config = $this->grav['config'];
            $obj = new Data\Data($config->get($type, []), $blueprints);
            $obj->merge($post);

            // FIXME: We shouldn't allow user to change configuration files in system folder!
            $filename = $this->grav['locator']->findResource("config://{$type}.yaml")
                ?: $this->grav['locator']->findResource("config://{$type}.yaml", true, true);
            $file = CompiledYamlFile::instance($filename);
            $obj->file($file);
            $data[$type] = $obj;
        } else {
            throw new \RuntimeException("Data type '{$type}' doesn't exist!");
        }

        return $data[$type];
    }

    
}
