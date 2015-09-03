package config

import (
	"flag"
	"stathat.com/c/jconfig"
)

var config *jconfig.Config
var configPath string

func init() {
	flag.StringVar(&configPath, "config", "config.json", "Path to config file")
}

func Get() *jconfig.Config {
	if config == nil {
		if !flag.Parsed() {
			flag.Parse()
		}
		config = jconfig.LoadConfig(configPath)
	}
	return config
}
