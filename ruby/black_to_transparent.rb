require 'rubygems'
require 'RMagick'
include Magick

dir_name = "source/"
output_dir_name = "Actors"

Dir.entries(dir_name).each do |filename|
  next if filename == "."
  next if filename == ".."

  img = ImageList.new(dir_name+ "/" + filename)
  img = img.transparent("#000000", Magick::TransparentOpacity)
  puts filename
  img.write(output_dir_name + "/" + filename)
end


=begin
test = ImageList.new("wc34.png")
trans = test.transparent("#000000", Magick::TransparentOpacity)
trans.display
#trans.write("br2a_clear.png")
exit
=end
