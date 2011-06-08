cd /root/lvm
svn update
rm -rf sceneexport
svn export scene2 sceneexport
grep -rl "local:" sceneexport | xargs sed -i 's!local://!http://www.realxtend.org/world/lvm/!g'
cp sceneexport/assets/*.* /var/www/world/lvm/  
cp sceneexport/assets/*/*.* /var/www/world/lvm/
cp sceneexport/assets/*/*/*.* /var/www/world/lvm/
cp sceneexport/*.txml /var/www/world/lvm/
    
