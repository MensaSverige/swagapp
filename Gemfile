source 'https://rubygems.org'

# You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
ruby ">= 2.6.10"

gem 'bigdecimal', '~> 3.1'
gem 'plist',      '~> 3.7'
gem 'mutex_m'
gem 'CFPropertyList', '>= 3.0.7'

gem 'cocoapods', '~> 1.13'
gem 'activesupport', '>= 6.1.7.3', '< 7.1.0'

gem 'fastlane'

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
