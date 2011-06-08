#studio:/var/www/rexlunatica# 
hg revert --all
hg pull
hg update
grep -rl "local:" *.* | xargs sed -i 's!local://!http://www.playsign.fi/lunatica/!g'
