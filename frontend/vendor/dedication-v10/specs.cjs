const entries=[
 {id:'a1',name:'释迦牟尼佛',response:'举掌金波 · 慈光舒展',bounds:[372,38,1299,903]},
 {id:'a2',name:'阿弥陀佛',response:'掌中莲华 · 花光升起',bounds:[526,38,1145,903]},
 {id:'a3',name:'药师佛',response:'器中青金 · 琉璃光流',bounds:[550,38,1122,903]},
 {id:'a4',name:'弥勒佛',response:'念珠流光 · 福光散开',bounds:[298,38,1373,903]},
 {id:'a5',name:'文殊菩萨',response:'手印金线 · 智慧光展',bounds:[531,38,1141,903]},
 {id:'a6',name:'普贤菩萨',response:'持莲花雨 · 粉金飘落',bounds:[579,38,1092,903]},
 {id:'a7',name:'观音菩萨',response:'净水回向 · 身前倾洒',bounds:[569,38,1103,903]},
 {id:'a8',name:'地藏菩萨',response:'宝珠锡杖 · 金光接引',bounds:[559,38,1113,903]}
];
for(const x of entries){const [l,t,r,b]=x.bounds,scale=x.id==='a7'?1.03:Math.min(1.03,900/(r-l));x.transform={scale,ox:480-(l+r)*.5*scale,oy:1049-b*scale};if(x.id==='a7')x.transform={scale:1.03,ox:480-836*1.03,oy:119}}
module.exports=entries;
