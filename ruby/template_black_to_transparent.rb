require 'rubygems'
require 'RMagick'
require 'json'
include Magick

json_name = "temperat.json"
dir_name = "TemperateBackup"
output_dir_name = "Temperate"

jsonFile = File.read(json_name)
json = JSON.parse(jsonFile)

not_visible = {}
json.each {|k,v|
  if v["visibleChunks"].include?(0)
    not_visible[v["path"]+".png"] = v
  end
}

Dir.entries(dir_name).each do |filename|
  next if filename == "."
  next if filename == ".."

  img = ImageList.new(dir_name+ "/" + filename)
  if not_visible.keys.include?(filename)
    img = img.transparent("#000000", Magick::TransparentOpacity)
    puts filename
  end
  img.write(output_dir_name + "/" + filename)
end


=begin
test = ImageList.new("wc34.png")
trans = test.transparent("#000000", Magick::TransparentOpacity)
trans.display
#trans.write("br2a_clear.png")
exit
=end
