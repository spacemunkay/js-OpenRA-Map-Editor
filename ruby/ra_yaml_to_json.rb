require 'rubygems'
require 'json'
require 'yaml'

#base_file_name = "snow"
base_file_name = "temperat"
count = 0
out_hash = {};
last_template = nil

File.open( base_file_name + ".yaml" ).each do |line|
  
  if line.match(/\tTemplate@(\d+)*/)
    puts line.inspect  
    puts "id: #{$1}"
    out_hash[$1] = {:id => $1.to_i }
    last_template = $1
    count += 1
  end

  if line.match(/\t\tImage:\s*(\w+)\b/)
    puts "image: #{$1}"
    out_hash[last_template][:path] = $1 
  end

  if line.match(/\t\tSize:\s*(\d+),(\d+)/)
    puts "width: #{$1} height: #{$2}"
    out_hash[last_template][:width] = $1 
    out_hash[last_template][:height] = $2
    out_hash[last_template][:visibleChunks] = Array.new($1.to_i*$2.to_i).fill(0)
  end

  if line.match(/(\d{1,2}):\s*\w+/)
    puts "visible: #{$1.to_i}"
    out_hash[last_template][:visibleChunks][$1.to_i] = 1
  end

end
puts "------------------------"
puts "#{count} templates found"
File.open(base_file_name + ".json","w") do |f|
  f.write(out_hash.to_json)
end
