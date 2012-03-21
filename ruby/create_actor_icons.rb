require 'rubygems'
require 'RMagick'
require 'json'
include Magick

#base_file_name = "snow"
base_file_name = "actor"

file = File.open( base_file_name + ".json" , "rb")
actors =  JSON.parse(file.read)

json_name = "actor.json"
dir_name = "Actors"
output_dir_name = "ActorIcons"

jsonFile = File.read(json_name)
json = JSON.parse(jsonFile)

Dir.entries(dir_name).each do |filename|
  next if filename == "."
  next if filename == ".."
  next if filename == ".DS_Store"

=begin
  img = ImageList.new(dir_name+ "/" + filename)
  img.fuzz = 9000
  img = img.transparent("#00FF00", Magick::TransparentOpacity).transparent("#58fc54", Magick::TransparentOpacity)
=end
  puts filename
  name = filename.split(".")[0]
  puts name
  width = json[name]["width"].to_i
  height = json[name]["height"].to_i

  img = ImageList.new(dir_name+ "/" + filename)
  if filename.match("make")
    puts filename
    gravity = EastGravity
  else
    gravity = WestGravity
  end
  img = img.crop(gravity, width, height)
  img.write(output_dir_name + "/" + filename)
end

=begin
File.open(base_file_name + ".json","w") do |f|
  f.write(out_hash.to_json)
end
#00ff00
=end
