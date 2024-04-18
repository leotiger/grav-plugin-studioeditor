<?php

namespace Grav\Plugin;

use Grav\Common\File\CompiledYamlFile;
use Grav\Common\GPM\GPM;
use Grav\Common\Grav;
use Grav\Common\Config\Config;
use Grav\Common\Inflector;
use Grav\Common\Language\Language;
use Grav\Common\Page\Page;
use Grav\Common\Page\Pages;
use Grav\Common\Plugin;
use Grav\Common\Uri;
use RocketTheme\Toolbox\Event\Event;
use Grav\Plugin\Shortcodes\BlockShortcode;

require_once 'adapters/resize_imagick.php';
require_once 'adapters/resize_gd.php';

class StudioEditorPlugin extends Plugin {

    /**
     * Instance of MathJax class
     *
     * @var Grav\Plugin\MathJax
     */
    protected $mathjax;
    public $features = [
        'blueprints' => 1000,
    ];
    protected $route = 'studioeditor';
    protected $studioeditor;
    protected $uri;
    protected $img_cache_state;

    /**
     * @var string
     */
    protected $adapter;

    /**
     * @var array
     */
    protected $sizes;
    protected $twig_link_regex = '/\!*\[(?:.*)\]\((\{([\{%#])\s*(.*?)\s*(?:\2|\})\})\)/';

    /**
     * @return array
     */
    public static function getSubscribedEvents() {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 999],
            'onFormProcessed' => ['onFormProcessed', 0],
            'onFormValidationError' => ['onFormValidationError', 0],
            'onTNTSearchIndex' => ['onTNTSearchIndex', 0],
        ];
    }

    /**
     * Enable only if url matches to the configuration.
     */
    public function onPluginsInitialized() {
        if (!$this->isAdmin()) {
            // Initialize MathJax class
            require_once(__DIR__ . '/classes/MathJax.php');
            $this->mathjax = new StudioEditorMathJax();

            // Process contents order according to weight option
            // (default: -5): to process page content right after SmartyPants
            $weight = $this->config->get('plugins.studioeditor.mathjax_weight', -5);

            // Register events
            $this->enable([
                'onShortcodesInitialized' => ['onShortcodesInitialized', 0],
                'onMarkdownInitialized' => ['onMarkdownInitialized', -300],
                'onPageContentRaw' => ['onPageContentRaw', 0],
                'onPageContentProcessed' => ['onPageContentProcessed', $weight],
                'onOutputGenerated' => ['onOutputGenerated', -1000],
                //'onPageInitialized'      => ['pageFallbacks', -100],   
                'onTwigInitialized' => ['onTwigInitialized', 0],
                'onTwigSiteVariables' => ['onTwigSiteVariables', 0],
                'onTwigExtensions' => ['onTwigExtensions', -200],
            ]);

            //return;
        } else {

            /** @var Uri $uri */
            $uri = $this->grav['uri'];

            $this->enable([
                'onBlueprintCreated' => ['onAdminBlueprintCreated', 0],
                'onTwigTemplatePaths' => ['onAdminTwigTemplatePaths', 0],
                'onTwigSiteVariables' => ['onAdminTwigSiteVariables', 1000],
                //'onGetPageBlueprints' => ['onAdminGetPageBlueprints', 0],
                'onGetPageTemplates' => ['onAdminGetPageTemplates', 0],
                'onAdminData' => ['onAdminData', 0],
                'onAdminSave' => ['onAdminResetImages', 1000],
                //'onAdminAfterSave' => ['onAdminResizeImages', 0],	
                //'onAdminSave' => ['onAdminSynchronizePages', 1001],	
                'onAdminAfterSave' => ['onAdminSynchronizePages', 1000],
                'onAdminAfterAddMedia' => ['onAdminAfterAddMedia', 0],
                    //'onAdminAfterSave' => ['onAdminAfterSave', 0],
                    //'onAdminMenu' => ['onAdminMenu', 0],
            ]);
            // Initialize admin class.
            require_once __DIR__ . '/classes/studioeditor.php';

            $this->studioeditor = new StudioEditor($this->grav);

            // And store the class into DI container.
            $this->grav['studioeditor'] = $this->studioeditor;
            /** @var Pages $pages */
            $pages = $this->grav['pages'];

            $this->grav['admin']->routes = $pages->routes();
            $config = $this->grav['config'];
            $this->img_cache_state = $config->get('system.images.cache_all', false);
        }
    }

    /**
     * Extend page blueprints with MathJax configuration options.
     *
     * @param Event $event
     */
    public function onAdminBlueprintCreated(Event $event) {
        /** @var Blueprints $blueprint */
        $blueprint = $event['blueprint'];
        //dump("line 146");
        //dump($blueprint);
        /*
          if ($blueprint->get('form/fields/tabs')) {
          $blueprints = new Blueprints(__DIR__ . '/blueprints');
          $extends = $blueprints->get($this->name);
          $blueprint->extend($extends, true);
          }
         * 
         */
    }

    /**
     * Determine which adapter is preferred and whether or not it's available.
     * Construct an instance of that adapter and return it.
     * @param  string $source - Source image path
     * @return mixed          - Either an instance of ImagickAdapter, GDAdapter or false if none of the extensions were available
     */
    protected function getImageAdapter($source) {
        $imagick_exists = class_exists('\Imagick');
        $gd_exists = extension_loaded('gd');

        $use_imagick = $imagick_exists ? $this->adapter == 'imagick' : false;
        $use_gd = $gd_exists ? $this->adapter == 'gd' : false;

        if ($use_imagick) {
            return new ResizeImagickAdapter($source);
        } else if ($use_gd) {
            return new ResizeGDAdapter($source);
        } else {
            return false;
        }
    }

    /**
     * Resizes an image using either Imagick or GD
     * @param  string $source    - Source image path
     * @param  string $target    - Target image path
     * @param  float $width      - Target width
     * @param  float $height     - Target height
     * @param  int [$quality=95] - Compression quality for target image
     * @return bool              - Returns true on success, otherwise false
     */
    protected function resizeImage($source, $target, $width, $height, $quality = 95) {
        $adapter = $this->getImageAdapter($source);
        $adapter->resize($width, $height);
        $adapter->setQuality($quality);
        return $adapter->save($target);
    }

    /**
     * Bypass image cache
     */
    protected function bypassImageCache($state = 'start') {
        $config = $this->grav['config'];
        if ($state == 'start') {
            $config = $this->grav['config'];
            //only necessary if enabled in system configuration
            if ($this->img_cache_state) {
                $config->reload()->save();
                $config->set('system.images.cache_all', false);
            }
        } else {
            //only necessary if enabled in system configuration
            if ($this->img_cache_state) {
                $config->reload()->save();
                $config->set('system.images.cache_all', true);
            }
        }
    }

    /**
     * Called when a page is saved from the admin plugin. Will generate
     * responsive image alternatives for image that don't have any.
     */
    public function onAdminResizeImages($event) {
        $page = $event['object'];
        if (null !== $page && (!method_exists($page, 'isPage') || (method_exists($page, 'isPage') && !$page->isPage()))) {
            //if (!$page instanceof Page) {
            //$this->grav['log']->warning("Object not a page");			
            return false;
        }

        $this->bypassImageCache('start');

        $this->sizes = (array) $this->config->get('plugins.studioeditor.sizes');
        $this->adapter = $this->config->get('plugins.studioeditor.adapter', 'imagick');

        foreach ($page->media()->images() as $filename => $medium) {
            $srcset = $medium->srcset(false);

            if ($srcset != '') {
                continue;
            }

            $source_path = $medium->path(false);
            $info = pathinfo($source_path);
            $count = 0;

            foreach ($this->sizes as $i => $size) {
                if ($size['width'] >= $medium->width) {
                    continue;
                }

                $count++;
                $dest_path = "{$info['dirname']}/{$info['filename']}@{$count}x." . strtolower("{$info['extension']}");
                $width = $size['width'];
                $quality = $size['quality'];
                $height = ($width / $medium->width) * $medium->height;

                $this->resizeImage($source_path, $dest_path, $width, $height, $quality, $medium->width, $medium->height);
            }
            if ($count > 0) {
                $original_index = $count + 1;
                if (file_exists($source_path)) {
                    rename($source_path, "{$info['dirname']}/{$info['filename']}@{$original_index}x." . strtolower("{$info['extension']}"));
                }
                if (file_exists("{$info['dirname']}/{$info['filename']}@1x.{$info['extension']}")) {
                    rename("{$info['dirname']}/{$info['filename']}@1x.{$info['extension']}", "{$info['dirname']}/{$info['filename']}." . strtolower("{$info['extension']}"));
                }
            } elseif (file_exists("{$info['dirname']}/{$info['filename']}.{$info['extension']}")) {
                // Fix bizarre problem with uppercase file extensions for our StackEdit editor
                rename("{$info['dirname']}/{$info['filename']}.{$info['extension']}", "{$info['dirname']}/{$info['filename']}." . strtolower("{$info['extension']}"));
            }
            $this->grav['admin']->setMessage("Resized $filename $count times", 'info');
        }
        $this->sanitizeImageFilenames($event);
        $this->bypassImageCache('end');
    }

    /**
     * Dynamically run fallbacks for existing but unpublished pages
     */
    public function pageFallbacks($event) {
        //$uri = $this->grav['uri'];
        //$pages = $this->grav['pages'];
        //$page = $pages->dispatch($uri->path());

        $page = $event['object'];
        if (null !== $page && (!method_exists($page, 'isPage') || (method_exists($page, 'isPage') && !$page->isPage()))) {
            //if (!$page instanceof Page) {
            //$this->grav['log']->warning("Object not a page");			
            return false;
        }
        // Not working, needs revision for current Grav Versions > 1.7
        return false;

        //throw new RuntimeException('Failed: Cannot set page parent to self');
        $pageLang = $page->language();
        $pageFile = $page->file()->basename() . '.md';
        $isDerivated = false;
        $defLang = $this->grav['language']->getDefault();

        $pageBlueprints = $this->config->get('plugins.studioeditor.pageblueprints');
        if ($pageBlueprints) {
            foreach ($pageBlueprints as $index => $pageBlueprint) {
                if ($pageFile === $pageBlueprint['blueprint'] . '.' . $pageLang . '.md') {
                    $isDerivated = true;
                }
            }
        }
        /*
          if ($pageLang !== $defLang && !$page->header()->published()) {
          $defPath = $page->path() . '/' . str_replace('.' . $defLang . '.md', '.' . $defLang . '.md', $pageFile);
          if (file_exists($defPath)) {
          $def_page = new Page();
          $def_page->init(new \SplFileInfo($defPath), $defLang . '.md');
          if ($def_page->published()) {
          $page = $def_page;
          }
          }
          }
         * 
         */
    }

    /**
     * Called when a page is saved from the admin plugin.
     */
    public function onAdminSynchronizePages($event) {

        $page = $event['object'];
        if (null !== $page && (!method_exists($page, 'isPage') || (method_exists($page, 'isPage') && !$page->isPage()))) {
            //if (!$page instanceof Page) {
            //$this->grav['log']->warning("Object not a page");			
            return false;
        }

        if ($this->config->get('system.cache.autotouch', false) && method_exists($this->grav['cache'], 'disableAutotouch')) {
            $this->grav['cache']->disableAutotouch();
        }

        $pageLang = $page->language();
        $pageFile = $page->name();
        //$pageFile = $page->file()->basename() . '.md';

        $languages = $this->grav['language']->getLanguages();
        $defLang = $this->grav['language']->getDefault();
        //$this->grav['log']->warning("What's that: " . $pageFile  . ' : Lang: ' . $defLang . ' : ' . $pageLang);
        //throw new RuntimeException('Failed: Cannot set page parent to self');
        if (isset($page->header()->shoppingcart)) {
            //$page->modifyHeader('shoppingcart', null);
            //$page->save();
            $this->grav['log']->warning("Shoppingcart config present in page: " . $page->path() . ' : Lang: ' . $pageLang);
        };

        $isDerivated = false;

        //$this->grav['admin']->setMessage("Please save again to generate a new set of optimized image variations.", 'info');	

        $pageBlueprints = $this->config->get('plugins.studioeditor.pageblueprints');
        if ($pageBlueprints) {
            foreach ($pageBlueprints as $index => $pageBlueprint) {
                if ($pageFile === $pageBlueprint['blueprint'] . '.' . $pageLang . '.md') {
                    $isDerivated = true;
                }
            }
        }

        /*

          if ($pageLang && ($pageFile === 'modular.' . $pageLang . '.md' || $pageFile === 'default.' . $pageLang . '.md' || $pageFile === 'form.' . $pageLang . '.md' || $pageFile === 'exposition.' . $pageLang . '.md' || $pageFile === 'blog.' . $pageLang . '.md' || $pageFile === 'default.' . $pageLang . '.md' || $isDerivated)) {
          $author = isset($page->header()->author) ? $page->header()->author : '';;
          $fullwidth = isset($page->header()->fullwidth) ? $page->header()->fullwidth : 'row';
          $videoset = isset($page->header()->videoset) ? $page->header()->videoset : '';;
          $bgimage = isset($page->header()->bgimage) ? $page->header()->bgimage : '';
          $bgcolor = isset($page->header()->bgcolor) ? $page->header()->bgcolor : '';
          $shareicons = isset($page->header()->shareicons) ? $page->header()->shareicons : 0;
          $fontcolor = isset($page->header()->fontcolor) ? $page->header()->fontcolor : '';
          $allowcomments = isset($page->header()->allowcomments) ? $page->header()->allowcomments : 0;
          $content = isset($page->header()->content) ? $page->header()->content : false;
          $fontsize = isset($page->header()->fontsize) ? $page->header()->fontsize : 1.0;
          $relatedPages = isset($page->header()->related_pages) ? $page->header()->related_pages : null;
          $slider = isset($page->header()->slider) ? $page->header()->slider : false;
          $taxonomy = isset($page->header()->taxonomy) ? $page->header()->taxonomy : false;
          $selection = isset($page->header()->selection) ? $page->header()->selection : false;
          $form = isset($page->header()->form) ? $page->header()->form : false;

          // Reset langauge content
          $postdata = $_POST["data"];
          $resetContent = isset($postdata['header']) && isset($postdata['header']['resetcontent']) && $postdata['header']['resetcontent'];
          $resetGallery = isset($postdata['header']) && isset($postdata['header']['resetgallery']) && $postdata['header']['resetgallery'];
          $resetCover = isset($postdata['header']) && isset($postdata['header']['resetcover']) && $postdata['header']['resetcover'];

          $sources = false;
          $studiosources = false;
          $cover = false;
          $pageContent = false;

          if ($pageLang === $defLang && count($languages) && ($resetContent || $resetGallery || $resetCover)) {
          if ($resetContent) {
          $pageContent = $page->rawMarkdown();
          }
          if ($resetGallery) {
          $sources = isset($page->header()->sources) ? $page->header()->sources : false;
          $studiosources = isset($page->header()->studiosources) ? $page->header()->studiosources : false;
          }
          if ($resetCover) {
          $cover = isset($page->header()->cover) ? $page->header()->cover : false;
          }
          }
          if (isset($page->header()->shoppingcart)) {
          unset($page->header()->shoppingcart);
          }
          $page->save();

          if (count($page->translatedLanguages())) {
          foreach($page->translatedLanguages() as $lang => $translation) {
          if ($lang != $pageLang) {
          $langPath = $page->path() . '/' . str_replace('.' . $pageLang . '.md', '.' . $lang . '.md', $pageFile);
          //don't overwrite existing translation efforts
          $translated_page = new Page();
          $translated_page->init(new \SplFileInfo($langPath), $translation . '.md');

          $translated_page->filePath($langPath);
          $translated_page->modifyHeader('author', $author);
          $translated_page->modifyHeader('fullwidth', $fullwidth);
          $translated_page->modifyHeader('videoset', $videoset);
          $translated_page->modifyHeader('bgimage', $bgimage);
          $translated_page->modifyHeader('bgcolor', $bgcolor);
          $translated_page->modifyHeader('shareicons', $shareicons);
          $translated_page->modifyHeader('fontcolor', $fontcolor);
          $translated_page->modifyHeader('allowcommments', $allowcomments);
          $translated_page->modifyHeader('fontsize', $fontsize);
          $translated_page->modifyHeader('related_pages', $relatedPages);
          $translated_page->modifyHeader('slider', $slider);
          if ($form) {
          $translated_page->modifyHeader('form', $form);
          }
          if ($content) {
          $translated_page->modifyHeader('content', $content);
          }
          if ($taxonomy) {
          $translated_page->modifyHeader('taxonomy', $taxonomy);
          }
          if ($selection) {
          $translated_page->modifyHeader('selection', $selection);
          }
          if ($pageContent) {
          $translated_page->rawMarkdown($pageContent);
          }
          if ($sources) {
          $translated_page->modifyHeader('sources', $sources);
          }
          if ($studiosources) {
          $translated_page->modifyHeader('studiosources', $studiosources);
          }
          if ($cover) {
          $translated_page->modifyHeader('cover', $cover);
          }
          if (isset($translated_page->header()->shoppingcart)) {
          unset($translated_page->header()->shoppingcart);
          }
          $translated_page->save();
          }
          }
          }
          foreach($page->untranslatedLanguages(true) as $lang => $translation) {
          if ($translation != $pageLang) {
          $langPath = $page->path() . '/' . str_replace('.' . $pageLang . '.md', '.' . $translation . '.md', $pageFile);

          if (file_exists($langPath)) {
          //don't overwrite existing translation efforts
          $translated_page = new Page();
          $translated_page->init(new \SplFileInfo($langPath), $translation . '.md');
          $translated_page->modifyHeader('published', false);
          $translated_page->modifyHeader('author', $author);
          $translated_page->modifyHeader('fullwidth', $fullwidth);
          $translated_page->modifyHeader('videoset', $videoset);
          $translated_page->modifyHeader('bgimage', $bgimage);
          $translated_page->modifyHeader('bgcolor', $bgcolor);
          $translated_page->modifyHeader('shareicons', $shareicons);
          $translated_page->modifyHeader('fontcolor', $fontcolor);
          $translated_page->modifyHeader('allowcommments', $allowcomments);
          $translated_page->modifyHeader('fontsize', $fontsize);
          $translated_page->modifyHeader('related_pages', $relatedPages);
          if ($content) {
          $translated_page->modifyHeader('content', $content);
          }
          if ($taxonomy) {
          $translated_page->modifyHeader('taxonomy', $taxonomy);
          }
          if ($selection) {
          $translated_page->modifyHeader('selection', $selection);
          }
          if ($pageContent) {
          $translated_page->rawMarkdown($pageContent);
          }
          if ($sources) {
          $translated_page->modifyHeader('sources', $sources);
          }
          if ($studiosources) {
          $translated_page->modifyHeader('studiosources', $studiosources);
          }
          if ($cover) {
          $translated_page->modifyHeader('cover', $cover);
          }

          if (isset($translated_page->header()->shoppingcart)) {
          unset($translated_page->header()->shoppingcart);
          }

          $translated_page->save();
          $this->grav['log']->info("Page synchro: " . $langPath);
          } else {
          //don't create a new one, save existing with data filled in to translate
          //$page->filePath($langPath);
          //$page->modifyHeader('published', false);
          //$page->save();
          }

          }

          }

          }
         */

        $this->onAdminResizeImages($event);

        //super fast way to refresh apcu or memcached... 
        $user_config = USER_DIR . 'config/system.yaml';
        touch($user_config);
        return $page;
    }

    public function onFormProcessed(Event $event) {
        /** @var Form $form */
        $form = $event['form'];
        $action = $event['action'];
        $params = $event['params'];

        if ($action == 'autotouch') {
            $user_config = USER_DIR . 'config/system.yaml';
            touch($user_config);
        }
    }

    public function onFormValidationError(Event $event) {
        $user_config = USER_DIR . 'config/system.yaml';
        touch($user_config);
        $this->grav['log']->info('Form validation error triggered touch');
    }

    /**
     * Called when a page is saved from the admin plugin. Will check 
     * filenames of page attachments.
     */
    public function onAdminResetImages($event) {
        $page = $event['object'];
        if (null !== $page && (!method_exists($page, 'isPage') || (method_exists($page, 'isPage') && !$page->isPage()))) {
            //if (!$page instanceof Page) {
            //$this->grav['log']->warning("Object not a page");			
            return false;
        }
        /*
          if (!$page instanceof Page) {
          return false;
          }
         */
        $this->bypassImageCache('start');

        $postdata = $_POST["data"];
        $inform = false;
        $seconds = 0;
        if (isset($postdata['header']) && isset($postdata['header']['resizeall']) && $postdata['header']['resizeall']) {
            foreach ($page->media()->images() as $filename => $medium) {
                $source_path = $medium->path(false);
                $info = pathinfo($source_path);
                $base_image_path = "{$info['dirname']}/$filename";
                $cleared = false;
                $derivates = 1;
                //19 derivates should be enough
                while ($derivates < 20) {
                    $test_path = "{$info['dirname']}/{$info['filename']}@{$derivates}x.{$info['extension']}";
                    if (file_exists($test_path)) {
                        if (file_exists($base_image_path)) {
                            unlink($base_image_path);
                        }
                        rename($test_path, $base_image_path);
                        $cleared = true;
                    }
                    $derivates++;
                }
                if ($cleared) {
                    $seconds += 10;
                    $inform = true;
                    $this->grav['admin']->setMessage("Variations of $filename cleared.", 'info');
                    //$medium->reset();
                    //$medium->clearAlternatives();
                    //$medium->path(true);
                    //$cache = $medium->cache();
                    /*
                      $image_info = getimagesize($base_image_path);
                      $width = $image_info[0];
                      $height = $image_info[1];

                      $medium->width($width);
                      $medium->height($height);
                     */
                    //$srcset = $medium->srcset(true);					
                }
            }
        }
        if ($inform) {
            $this->grav['admin']->setMessage("Please save again to generate a new set of optimized image variations.", 'info');
            $this->grav['admin']->setMessage("The generation of optimized variations may take up to $seconds seconds.", 'info');
        }
        $this->bypassImageCache('end');
        //$this->onAdminSynchronizePages($event);
        return $page;
    }

    /**
     * Called when a page is saved from the admin plugin. Will check 
     * filenames of page attachments.
     */
    public function onAdminAfterAddMedia($event) {

        $page = $event['page'];
        $filename = $_FILES['file']['name'];
        $newfilename = $filename;

        if (!preg_match('/^[a-zA-Z0-9][\-_a-zA-Z0-9\.]*$/i', $filename)) {
            $newfilename = preg_replace('/[^\-a-zA-Z0-9_\.]/', '-', $filename);
        }
        if ($filename != $newfilename) {
            rename(sprintf('%s/%s', $page->path(), $filename), sprintf('%s/%s', $page->path(), $newfilename));
            $_FILES['file']['name'] = $newfilename;
        }
    }

    /**
     * Called when a page is saved from the admin plugin. Will check 
     * filenames of page attachments and rename them just in case
     */
    protected function sanitizeImageFilenames($event) {
        $page = $event['object'];
        if (null !== $page && (!method_exists($page, 'isPage') || (method_exists($page, 'isPage') && !$page->isPage()))) {
            //if (!$page instanceof Page) {
            //$this->grav['log']->warning("Object not a page");			
            return false;
        }


        //$this->bypassImageCache('start');

        $this->sizes = array();

        if ($this->config->get('plugins.resize-images.enabled')) {
            $this->sizes = (array) $this->config->get('plugins.resize-images.sizes');
        }
        foreach ($page->media()->images() as $filename => $medium) {
            //$srcset = $medium->srcset(false);
            /*
              if ($srcset != '') {
              continue;
              }
             */

            $source_path = $medium->path(false);
            $info = pathinfo($source_path);
            $count = 0;
            $newfilename = $filename;
            if (!preg_match('/^[a-zA-Z0-9][\-_a-zA-Z0-9\.]*$/i', $info['filename'])) {
                $newfilename = preg_replace('/[^\-a-zA-Z0-9_\.]/', '-', $info['filename']);
            }

            foreach ($this->sizes as $i => $size) {
                if ($size['width'] >= $medium->width) {
                    continue;
                }

                $count++;
                $dest_path = "{$info['dirname']}/{$info['filename']}@{$count}x.{$info['extension']}";
                $width = $size['width'];
                $quality = $size['quality'];
                $height = ($width / $medium->width) * $medium->height;
                if (file_exists($dest_path) && $filename != $newfilename) {
                    $ren_path = "{$info['dirname']}/$newfilename@{$count}x.{$info['extension']}";
                    rename($dest_path, $ren_path);
                }
            }

            if ($filename != $newfilename) {
                $original_index = $count + 1;
                if (file_exists("{$info['dirname']}/{$info['filename']}@{$original_index}x.{$info['extension']}")) {
                    rename("{$info['dirname']}/{$info['filename']}@{$original_index}x.{$info['extension']}", "{$info['dirname']}/$newfilename@{$original_index}x." . strtolower($info['extension']));
                }
                if (file_exists($source_path)) {
                    rename($source_path, "{$info['dirname']}/$newfilename.{$info['extension']}");
                }
                $this->grav['admin']->setMessage("$filename and derivates renamed to $newfilename." . strtolower($info['extension']), 'info');
            } elseif (preg_match('/[A-Z]/', $info['extension']) && file_exists("{$info['dirname']}/{$info['filename']}.{$info['extension']}")) {
                rename("{$info['dirname']}/{$info['filename']}.{$info['extension']}", "{$info['dirname']}/{$info['filename']}." . strtolower($info['extension']));
            }
        }

        // Our StackEdit has a weired problem with upper case extensions for images, fix it
        foreach ($page->media()->images() as $filename => $medium) {
            $source_path = $medium->path(false);
            $info = pathinfo($source_path);
            $count = 0;
            if (!preg_match('/^[a-zA-Z0-9][-_a-zA-Z0-9\.]*$/i', $filename) && file_exists("{$info['dirname']}/{$info['filename']}.{$info['extension']}")) {
                $newfilename = preg_replace('/[^-a-zA-Z0-9_\.]/', '-', $info['filename']);
                $extension = strtolower($info['extension']);
                rename("{$info['dirname']}/{$info['filename']}.{$info['extension']}", "{$info['dirname']}/{$newfilename}." . strtolower($info['extension']));
                //rename($source_path, "{$info['dirname']}/{$newfilename}");
                $this->grav['admin']->setMessage("Renamed $filename to $newfilename", 'info');
            } elseif (preg_match('/[A-Z]/', $info['extension']) && file_exists("{$info['dirname']}/{$info['filename']}.{$info['extension']}")) {
                rename("{$info['dirname']}/{$info['filename']}.{$info['extension']}", "{$info['dirname']}/{$info['filename']}." . strtolower($info['extension']));
            }
        }

        //$this->bypassImageCache('end');
        foreach ($page->media()->images() as $filename => $medium) {
            $source_path = $medium->path(false);
            $info = pathinfo($source_path);
            //$medium->path
        }
    }

    /**
     * Add plugin templates path
     */
    public function onAdminData($type) {
        //$this->grav['twig']->twig_paths[] = __DIR__ . '/admin/templates';
    }

    /**
     * Add plugin templates path
     */
    public function onAdminTwigTemplatePaths($event) {
        //$event['paths'] = array_merge($event['paths'], [__DIR__ . '/admin/templates']);
        //return $event;        
        $this->grav['twig']->twig_paths[] = __DIR__ . '/admin/templates';
    }

    /**
     * Set all twig variables for generating output.
     */
    public function onAdminTwigSiteVariables() {
        if ($this->isAdmin()) {


            $twig = $this->grav['twig'];

            $twig->twig_vars['studioeditor'] = $this->studioeditor;

            if (isset($twig->twig_vars['admin'])) {
                //$twigadmin = $twig->twig_vars['admin'];
                //$twig->twig_vars['admin']['blueprint'] == $this->studioeditor->blueprint();
            }

            $this->grav['assets']->add('plugin://studioeditor/css/pagedown.css');

            $this->grav['assets']->add('plugin://studioeditor/css/studioeditor.css');
            //$this->grav['assets']->add('plugin://studioeditor/js/Markdown.Converter.js');
            //$this->grav['assets']->add('plugin://studioeditor/js/Markdown.Sanitizer.js');
            //$this->grav['assets']->add('plugin://studioeditor/js/Markdown.Editor.js');
            $this->grav['assets']->add('plugin://studioeditor/js/tooltip.js');
            $this->grav['assets']->add('plugin://studioeditor/js/studioeditor.js');

            //$this->grav['assets']->add('https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML');
            if ($this->config->get('plugins.studioeditor.extras_built_in_css')) {
                $this->grav['assets']
                        ->add('plugin://studioeditor/assets/css/markdownextras.css');
            }
            $this->grav['assets']->add('plugin://studioeditor/assets/res/themes/main.css');
        }
    }

    public function onAdminGetPageBlueprints($event) {
        $types = $event->types;
        //$locator = Grav::instance()['locator'];
        $uri = $this->grav['uri'];

        $locator = $this->grav['locator'];
        $scanb = $locator->findResource('plugin:///studioeditor/blueprints', true);
        if (!is_string($scanb)) {
            throw new \InvalidArgumentException('Scan uris invalid');
        }
        //dump($types);
        //$types->init();      
        $types->scanBlueprints($scanb);
        dump($types);
    }

    public function onAdminGetPageTemplates($event) {
        $types = $event->types;
        $uri = $this->grav['uri'];

        $locator = $this->grav['locator'];
        //$scanb = $locator->findResource('plugin:///studioeditor/blueprints', true);
        $scant = $locator->findResource('plugin:///studioeditor/admin/templates', true);
        if (!is_string($scant)) {
            throw new \InvalidArgumentException('Scan uris invalid');
        }
        //$types->scanBlueprints($scanb);
        $types->scanTemplates($scant);
    }

    /**
     * Add navigation item to the admin plugin
     */
    public function onAdminMenu() {
        $this->grav['twig']->plugins_hooked_nav['PLUGIN_STUDIOEDITOR.STUDIOEDITOR'] = ['route' => $this->route, 'icon' => 'fa-file'];
    }

    /**
     * Pagedown processors
     */

    /**
     * Handle the markdown initialized event.
     *
     * @param  Event  $event The event containing the markdown parser
     */
    public function onMarkdownInitialized(Event $event) {
        /** @var Grav\Common\Markdown\Parsedownextra $markdown */
        $markdown = $event['markdown'];
        //$inlineTypes = $event['markdown']->InlineTypes;
        $this->mathjax->setupMarkdown($markdown);

        //$this->grav['log']->info("Studio Edtior Page Images: " . count($images));
        $iStrikethrough = 11; //array_search('~', array_keys($inlineTypes));


        $markdown->addInlineType("!", 'Underline');
        $markdown->inlineUnderline = function ($Excerpt) {
            if (!isset($Excerpt['text'][1])) {
                return;
            }
            if ($Excerpt['text'][1] === "!" and preg_match('/^\!\!(?=\S)(.+?)(?<=\S)\!\!/', $Excerpt['text'], $matches)) {
                return array(
                    'extent' => strlen($matches[0]),
                    'element' => array(
                        'name' => 'u',
                        'text' => $matches[1],
                        'handler' => 'line',
                    ),
                );
            }
        };

        $markdown->addBlockType('[', 'MediaServices', false, false);

        $markdown->blockMediaServices = function ($Excerpt) {
            if (preg_match('/\[\!(vimeo|youtube|soundcloud)\]\s?\([ \t]*(\S+)[ \t]*\)/u', $Excerpt['text'], $matches)) {
                switch ($matches[1]) {
                    case 'vimeo' :
                        $video = '<iframe src="https://player.vimeo.com/video/' . $matches[2] . '?color=ffffff" width="100%" height="360" frameborder="0" allowfullscreen></iframe>';
                        $block = array(
                            'element' => array(
                                'name' => 'div',
                                'handler' => 'lines',
                                'attributes' => array(
                                    'class' => 'external-services service-vimeo',
                                ),
                                'text' => (array) $video,
                            ),
                        );
                        return $block;
                        break;
                    case 'youtube' :
                        $video = '<iframe width="100%" height="315" src="https://www.youtube.com/embed/' . $matches[2] . '" frameborder="0" allowfullscreen></iframe>';
                        $block = array(
                            'element' => array(
                                'name' => 'div',
                                'handler' => 'lines',
                                'attributes' => array(
                                    'class' => 'external-services service-youtube',
                                ),
                                'text' => (array) $video,
                            ),
                        );
                        return $block;
                        break;
                    case 'soundcloud' :
                        $frame = '<iframe width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' .
                                $matches[2] . '&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>';
                        $block = array(
                            'element' => array(
                                'name' => 'div',
                                'handler' => 'lines',
                                'attributes' => array(
                                    'class' => 'external-services service-soundcloud',
                                ),
                                'text' => (array) $frame,
                            ),
                        );
                        return $block;
                        break;
                    default:
                        return;
                }

                //return $Block;
            } else {
                //$Excerpt['text'] = 'wow';
                return;
            }
        };

        if ($this->config->get('plugins.studioeditor.notices_active')) {
            $markdown->addBlockType('!', 'Notices', true, false);

            $markdown->blockNotices = function ($Line) {

                $this->level_classes = ['yellow', 'red', 'blue', 'green']; //$this->config->get('plugins.markdown-notices.level_classes');

                if (preg_match('/^(!{1,' . count($this->level_classes) . '})[ ]+(.*)/u', $Line['text'], $matches)) {
                    $level = strlen($matches[1]) - 1;

                    // if we have more levels than we support
                    if ($level > count($this->level_classes) - 1) {
                        return;
                    }

                    $text = $matches[2];

                    $Block = array(
                        'element' => array(
                            'name' => 'div',
                            'handler' => 'lines',
                            'attributes' => array(
                                'class' => 'notices ' . $this->level_classes[$level],
                            ),
                            'text' => (array) $text,
                        ),
                    );

                    return $Block;
                }
            };

            $markdown->blockNoticesContinue = function ($Line, array $Block) {
                if (isset($Block['interrupted'])) {
                    return;
                }

                if ($Line['text'][0] === '!' and preg_match('/^(!{1,' . count($this->level_classes) . '})(.*)/u', $Line['text'], $matches)) {
                    $Block['element']['text'] [] = ltrim($matches[2]);

                    return $Block;
                }
            };
        }
    }

    /**
     * Add content after page content was read into the system.
     *
     * @param  Event  $event An event object, when `onPageContentRaw` is
     *                       fired.
     */
    public function onPageContentRaw(Event $event) {
        /** @var Page $page */
        $page = $event['page'];

        $config = $this->mergeConfig($page);
        $enabled = ($config->get('enabled') && $config->get('mathjax_active')) ? true : false;

        // Reset MathJax instance
        $this->mathjax->reset();
        $this->mathjax->enabled($enabled);

        if ($enabled) {
            // Set X-UA-Compatible meta tag for Internet Explorer
            $metadata = $page->metadata();
            $metadata['X-UA-Compatible'] = array(
                'http_equiv' => 'X-UA-Compatible',
                'content' => 'IE=edge'
            );
            $page->metadata($metadata);
        }
    }

    /**
     * Add content after page was processed.
     *
     * @param Event $event An event object, when `onPageContentProcessed`
     *                     is fired.
     */
    public function onPageContentProcessed(Event $event) {
        // Get the page header
        $page = $event['page'];

        $config = $this->mergeConfig($page);
        $enabled = ($config->get('enabled') && $config->get('mathjax_active')) ? true : false;

        // Get modified content, replace all tokens with their
        // respective formula and write content back to page
        $type = $enabled ? 'html' : 'raw';
        $content = $page->getRawContent();
        $page->setRawContent($this->mathjax->normalize($content, $type));

        $content = $page->getRawContent();
        //$content = $this->imageWebp($page->content());
        //$page->setRawContent($content);

        if ($this->config->get('plugins.studioeditor.blockalign_active')) {

            $this->align_classes = array('l' => 'text-left', 'r' => 'text-right', 'c' => 'center', 'j' => 'text-justify');

            //text = text.replace(/^\<(blockquote|p|div|h[1-6]|li)([^\>]*)\>(.*?)[ ]{1,}(\|{1,1})([l|r|c|j]{1,1})[ ]*\<\/(blockquote|p|div|h[1-6]|li)\>/gm,

            $content = preg_replace_callback('/^[\t ]*\<(blockquote|p|div|h[1-6]|li|th|td|dt|dd)([^\>]*)\>[\n]*(.*?)[ ]{1,}(;{1,1})([l|r|c|j]{1,1})[\n\t ]*\<\/(blockquote|p|div|h[1-6]|li|th|td|dt|dd)\>/mu', function ($matches) {
                $align_class = $this->align_classes[$matches[5]];

                if (isset($matches[2]) && !empty($matches[2])) {
                    if (strpos($matches[2], "class=") === FALSE) {
                        $matches[2] = $matches[2] . " class='" . $align_class . "'";
                    } else {
                        $matches[2] = preg_replace('/class=([\'|"])/i', "class=$1 $align_class ", $matches[2]);
                    }
                } else {
                    $matches[2] = " class='" . $align_class . "'";
                }

                return "<" . $matches[1] . $matches[2] . ">" . $matches[3] . "</" . $matches[6] . ">";
            }, $content);
            
            $page->setRawContent($content);
        }
        if ($this->config->get('plugins.studioeditor.notices_active')) {

            $this->level_classes = ['yellow', 'red', 'blue', 'green']; //$this->config->get('plugins.markdown-notices.level_classes');
            //text = text.replace(/^\<(blockquote|p|div|h[1-6]|li)([^\>]*)\>(.*?)[ ]{1,}(\|{1,1})([l|r|c|j]{1,1})[ ]*\<\/(blockquote|p|div|h[1-6]|li)\>/gm,

            $content = preg_replace_callback('/^\<(blockquote|p|div|h[1-6])([^>]*)\>[\n\r]*(!{1,4})[ ]{1,}(.*?)\<\/(blockquote|p|div|h[1-6])\>/mu', function ($matches) {

                $level = mb_strlen($matches[3]) - 1;
                // if we have more levels than we support
                if ($level > count($this->level_classes) - 1) {
                    $level = count($this->level_classes) - 1;
                }
                $note_class = $this->level_classes[$level];
                return "<div class='notices " . $note_class . "'><" . $matches[1] . $matches[2] . ">" . $matches[4] . "</" . $matches[5] . "></div>";
            }, $content);
            $page->setRawContent($content);
        }
    }

    public function onOutputGenerated() {
        $this->grav->output = $this->imageWebp($this->grav->output); //$compressedHtml;   
    }

    protected function imageWebp($content) {
        if ($this->config->get('plugins.webp.enabled')) {
            if (!is_string($content) || trim($content) === '') {
                return;
            }
            preg_match_all('~(?<="|\'|\s|\()(?:/user/pages)/(?:[a-zA-Z0-9\@\-_\/\.]+)\.(?:jpe?g|png)(?>=\'|"|\s|\))~i', $content, $matches);
            foreach ($matches[0] as $match) {
                $trimmed = trim($match, '" )');
                //print_r($trimmed . '\r');            
                $webp = preg_replace('~\.(?:jpe?g|png)~', '.webp', $trimmed);
                if (file_exists(ROOT_DIR . $trimmed) && file_exists(ROOT_DIR . "/user/webp" . $webp)) {

                    $content = str_replace($trimmed, "/user/webp" . $webp, $content);
                }
            }
        }
        return $content;
    }

    /**
     * Initialize Twig configuration and filters.
     */
    public function onTwigInitialized() {
        // Expose function
        $this->grav['twig']->twig()->addFilter(
                new \Twig_SimpleFilter('mathjax', [$this, 'mathjaxFilter'], ['is_safe' => ['html']])
        );
    }

    /**
     * Set needed variables to display MathJax LaTeX formulas.
     */
    public function onTwigSiteVariables() {
        /** @var \Grav\Common\Assets $assets */
        $assets = $this->grav['assets'];

        /** @var Page $page */
        $page = $this->grav['page'];

        if ($this->config->get('plugins.studioeditor.extras_built_in_css')) {
            $this->grav['assets']->add('plugin://studioeditor/assets/css/markdownextras.css');
        }

        // Skip if active is set to false
        $config = $this->mergeConfig($page);
        if (!($config->get('enabled') && $config->get('mathjax_active'))) {
            return;
        }

        // Reset MathJax instance and enable parser
        $this->mathjax->reset();
        $this->mathjax->enabled(true);

        // Add MathJax stylesheet to page

        if ($this->config->get('plugins.studioeditor.mathjax_built_in_css')) {
            $assets->add('plugin://studioeditor/assets/css/mathjax.css');
        }

        // Add MathJax configuration file to page
        if ($this->config->get('plugins.studioeditor.mathjax_built_in_js')) {
            //$assets->add('plugins://studioeditor/js/mathjaxconfig.js', 'head');
        }
        $assets->add($this->config->get('plugins.studioeditor.mathjax_url'));
    }

    /**
     * Filter to parse MathJax formula.
     *
     * @param  string $content The content to be filtered.
     * @param  array  $options Array of options for the MathJax formula filter.
     *
     * @return string          The filtered content.
     */
    public function mathjaxFilter($content, $params = []) {
        // Get custom user configuration
        $page = func_num_args() > 2 ? func_get_arg(2) : $this->grav['page'];
        $config = $this->mergeConfig($page, true, $params);

        // Enable parser
        $this->mathjax->enabled(true);

        // Render content
        $content = $this->mathjax->render($content, $config, $page);
        $content = $this->mathjax->normalize($content);

        // Reset MathJax instance
        $this->mathjax->reset();
        return $content;
    }

    /**
     * Register {{% mathjax %}} shortcode.
     *
     * @param  Event  $event An event object.
     */
    public function onShortcodesInitialized(Event $event) {
        // Register {{% mathjax %}} shortcode
        $event['shortcodes']->register(
                new BlockShortcode('mathjax', function ($event) {
                            $weight = $this->config->get('plugins.studioeditor.mathjax_weight', -5);
                            $this->enable([
                                'onPageContentProcessed' => ['onPageContentProcessed', $weight]
                            ]);

                            // Update header variable to bypass evaluation
                            if (isset($event['page']->header()->mathjax->process)) {
                                $event['page']->header()->mathjax->process = true;
                            }

                            return $this->mathjax->mathjaxShortcode($event);
                        })
        );
    }

    public function onTwigExtensions() {
        require_once(__DIR__ . '/classes/twig-file-exists.php');
        require_once(__DIR__ . '/classes/twig-url-exists.php');
        require_once(__DIR__ . '/classes/twig-hextorgb.php');
        $this->grav['twig']->twig->addExtension(new \Twig_File_Exists());
        $this->grav['twig']->twig->addExtension(new \Twig_Url_Exists());
        $this->grav['twig']->twig->addExtension(new \Twig_HexToRgb());
    }

    public function onTNTSearchIndex(Event $e) {

        $fields = $e['fields'];
        $page = $e['page'];

        $template = $page->template();
        $pageBlueprints = $this->config->get('plugins.studioeditor.pageblueprints');
        $isDerivated = false;
        if ($pageBlueprints) {
            foreach ($pageBlueprints as $index => $pageBlueprint) {
                if ($template === $pageBlueprint['blueprint']) {
                    $isDerivated = true;
                }
            }
        }


        if (in_array($template, ['modular', 'default', 'exposition', 'blog']) || $isDerivated) {
            if (isset($page->header()->cover)) {
                //if ($page->header())
                if (isset($page->header()->cover['title'])) {
                    $fields->covertitle = $page->header()->cover['title'];
                }
                if (isset($page->header()->cover['summary'])) {
                    $fields->coversummary = $page->header()->cover['summary'];
                }
            }
            if (isset($page->header()->sources)) {
                foreach ($page->header()->sources as $index => $source) {

                    $title = 'sourcetitle' . $index;
                    $summary = 'sourcesummary' . $index;
                    $itemtext = 'sourcetext' . $index;
                    if (isset($source['title'])) {
                        $fields->$title = $source['title'];
                    }
                    if (isset($source['summary'])) {
                        $fields->$summary = $source['summary'];
                    }
                    if (isset($source['itemtext'])) {
                        $fields->$itemtext = $source['itemtext'];
                    }
                }
            }
            if (isset($page->header()->sliders)) {
                foreach ($page->header()->sliders as $index => $slider) {
                    $title = 'slidertitle' . $index;
                    $content = 'slidercontent' . $index;
                    if (isset($slider['title'])) {
                        $fields->$title = $slider['title'];
                    }
                    if (isset($slider['content'])) {
                        $fields->$content = $slider['content'];
                    }
                }
            }

            if (count($page->translatedLanguages())) {
                foreach ($page->translatedLanguages() as $lang => $translation) {
                    $langPath = $page->path() . '/' . $page->template() . '.' . $lang . '.md';
                    //don't overwrite existing translation efforts

                    if (file_exists($langPath)) {
                        $translated_page = new Page();
                        $translated_page->init(new \SplFileInfo($langPath));

                        if ($translated_page instanceof Page) {
                            $langcontent = $lang . "content";
                            $fields->$langcontent = $translated_page->content();

                            if (isset($translated_page->header()->cover)) {
                                $title = $lang . 'covertitle';
                                $summary = $lang . 'coversummary';
                                if (isset($translated_page->header()->cover['title'])) {
                                    $fields->$title = $translated_page->header()->cover['title'];
                                }
                                if (isset($translated_page->header()->cover['summary'])) {
                                    $fields->$summary = $translated_page->header()->cover['summary'];
                                }
                            }

                            if (isset($translated_page->header()->sources)) {
                                foreach ($translated_page->header()->sources as $index => $source) {
                                    $title = $lang . 'sourcetitle' . $index;
                                    $summary = $lang . 'sourcesummary' . $index;
                                    $itemtext = $lang . 'sourcetext' . $index;
                                    if (isset($source['title'])) {
                                        $fields->$title = $source['title'];
                                    }
                                    if (isset($source['summary'])) {
                                        $fields->$summary = $source['summary'];
                                    }
                                    if (isset($source['itemtext'])) {
                                        $fields->$itemtext = $source['itemtext'];
                                    }
                                }
                            }
                            if (isset($translated_page->header()->sliders)) {
                                foreach ($translated_page->header()->sliders as $index => $slider) {
                                    $title = $lang . 'slidertitle' . $index;
                                    $content = $lang . 'slidercontent' . $index;
                                    if (isset($slider['title'])) {
                                        $fields->$title = $slider['title'];
                                    }
                                    if (isset($slider['content'])) {
                                        $fields->$content = $slider['content'];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
