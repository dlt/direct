<?php

namespace Direct;

require_once __DIR__.'/ClassLoader.php';

/**
 * Abstrac Kernel class that provide the framework internals signature.
 *
 * @author Otavio Fernandes <otavio@neton.com.br>
 */
abstract class Kernel
{
    /**
     * Define the path info of application.
     * 
     * @var string
     */
    protected $appPath = null;
    /**
     * Autoloader class.
     * 
     * @var \Direct\ClassLoader
     */
    protected $loader = null;

    /**
     * Router objetct. s
     * 
     * @var \Direct\Router
     */
    protected $router = null;

    /**
     * Define the config enviroment to load.
     * 
     * @var string
     */
    protected $env = 'dev';
    
    public function __construct()
    {
        $this->loader = new ClassLoader();
    }
    
    /**
     * Register the vendor libraries
     */
    abstract public function registerLibraries();

    /**
     * Setup the development enviroment.
     */
    abstract public function setupDev();

    /**
     * Setup the production enviroment.
     */
    abstract public function setupProduction();

    /**
     * Setup the test enviroment.
     */
    abstract public function setupTest();


    /**
     * Register the framework constants
     */
    public function registerConstants()
    {
        define("APP_PATH", $this->appPath);
        define("ACTION_PATH", $this->appPath.'/actions');
        define("CONFIG_PATH", $this->appPath.'/config');
        define("CACHE_PATH", $this->appPath.'/cache');
        define("MODEL_PATH", $this->appPath.'/models');
        define("VIEW_PATH", $this->appPath.'/views');
    }

    /**
     * Register the framework internals dependencies
     */
    public function  registerInternals()
    {
        // register the namespaces to exposes to ClassLoader
        $this->loader->registerNamespaces(array(
            'Direct' => $this->appPath.'/lib/vendor',
            'Symfony' => $this->appPath.'/lib/vendor',
            'actions' => $this->appPath,
            'models' => $this->appPath
        ));

        // register PEAR like naming convention
        $this->loader->registerPrefixes(array(
           'sfYaml' => $this->appPath.'/lib/vendor/sfYaml',
           'Twig' => $this->appPath.'/lib/vendor',
        ));
    }

    /**
     * Run the Direct application
     */
    public function run()
    {
        // register framework properties and configs
        $this->registerConstants();
        $this->registerInternals();
        $this->registerLibraries();
        $this->loader->register();
        
        // get the enviroment setup method
        $setupMethod = 'setup'.ucfirst($this->env);
        
        if (!method_exists($this, $setupMethod))
        {
            throw new \Exception('The setup'.$setupMethod.' method was not found!');
        }

        $this->$setupMethod();

        // route the request
        $this->router = new Router();
        $this->router->route();
    }
}
