require 'rubygems'
require 'RMagick'
require 'json'
include Magick

base_file_name = "actors"
dir_name = "ActorIcons"
output_dir_name = "."

out_hash = {}
Dir.entries(dir_name).each do |filename|
  next if filename == "."
  next if filename == ".."
  next if filename == ".DS_Store"
  
  puts filename
  name = filename.split(".")[0]
  img = ImageList.new(dir_name+ "/" + filename)
  out_hash[name] = { :path => name, :width => img.columns, :height => img.rows}
  File.open(output_dir_name + "/" + base_file_name + ".json", "w" ) do |f|
    f.write(out_hash.to_json)
  end
end

