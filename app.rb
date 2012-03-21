require 'rubygems'
require 'sinatra'
require 'haml'

get '/get_map_bin' do
  send_file ("maps/map.bin"), :filename => "map.bin"
end

get '/' do
  haml :index 
end

get '/test' do
  haml :test
end
