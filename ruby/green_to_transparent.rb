require 'rubygems'
require 'RMagick'
require 'json'
include Magick

#base_file_name = "snow"
#base_file_name = "actor"

#file = File.open( base_file_name + ".json" , "rb")
#actors =  JSON.parse(file.read)
#puts actors.inspect

#json_name = "actor.json"
dir_name = "e_images"
output_dir_name = "final_e_files"

#jsonFile = File.read(json_name)
#json = JSON.parse(jsonFile)

Dir.entries(dir_name).each do |filename|
  next if filename == "."
  next if filename == ".."

  img = ImageList.new(dir_name+ "/" + filename)
  img.fuzz = 9000
  img = img.transparent("#00FF00", Magick::TransparentOpacity).transparent("#58fc54", Magick::TransparentOpacity)
  puts filename
  img.write(output_dir_name + "/" + filename)
end

=begin
File.open(base_file_name + ".json","w") do |f|
  f.write(out_hash.to_json)
end
#00ff00
=end
