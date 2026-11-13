import Phaser from 'phaser';
import { GameAudio } from './audio';
export type Result = {score:number; floors:number; perfectDrops:number; durationMs:number};
export function createGame(parent: HTMLElement, onScore:(score:number,floors:number,perfect:boolean)=>void, onEnd:(result:Result)=>void) {
 class Tower extends Phaser.Scene {
  private effects = new GameAudio();
  private ink!: Phaser.GameObjects.Graphics; private blocks:{x:number;y:number;w:number;color:number}[]=[];
  private phase=0; private activeX=240; private activeY=430; private falling=false; private velocity=0; private ended=false;
  private points=0; private floors=0; private perfect=0; private started=0; private offset=0;
  create() {
   this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.effects.dispose());
   this.ink=this.add.graphics(); this.started=this.time.now; this.blocks=[{x:240,y:610,w:190,color:0x364859}];
   this.input.on('pointerdown',()=>this.drop());
   this.input.keyboard?.on('keydown-SPACE',(event:KeyboardEvent)=>{event.preventDefault(); if(!event.repeat)this.drop();});
   onScore(0,0,false);
  }
  drop(){if(!this.ended&&!this.falling){this.effects.unlock();this.effects.drop();this.falling=true;this.velocity=0;}}
  update(_time:number,delta:number){
   if(this.ended)return; const dt=Math.min(delta,40)/1000; const top=this.blocks[this.blocks.length-1];
   const targetOffset=Math.max(0,610-top.y-220); this.offset=Phaser.Math.Linear(this.offset,targetOffset,Math.min(1,dt*7));
   if(!this.falling){this.phase+=dt*(1.25+Math.min(this.floors*.09,2.8));this.activeX=240+Math.sin(this.phase)*175;this.activeY=top.y-180;}
   else { this.velocity+=1500*dt;this.activeY+=this.velocity*dt;
    if(this.activeY>=top.y-34){
     const diff=Math.abs(this.activeX-top.x);const overlap=top.w-diff;
     if(overlap<=0){this.ended=true;this.effects.gameOver();this.draw();onEnd({score:this.points,floors:this.floors,perfectDrops:this.perfect,durationMs:Math.round(this.time.now-this.started)});return;}
     const perfect=diff<=9;const width=perfect?top.w:overlap;
     this.effects.land(perfect);
     const x=perfect?top.x:(Math.max(this.activeX-top.w/2,top.x-top.w/2)+Math.min(this.activeX+top.w/2,top.x+top.w/2))/2;
     this.floors++;this.points+=perfect?150:100; if(perfect)this.perfect++;
     this.blocks.push({x,y:top.y-34,w:width,color:[0xeab879,0xe7a968,0xd69459,0xf0c791][this.floors%4]});
     if(this.blocks.length>22)this.blocks.shift();this.falling=false;this.phase+=.6;onScore(this.points,this.floors,perfect);
    }
   } this.draw();
  }
  draw(){const g=this.ink;g.clear();g.fillStyle(0x132539);g.fillRect(0,0,480,700);
   g.fillStyle(0xf0d6a3,.8);g.fillCircle(386,95,31);g.fillStyle(0x132539);g.fillCircle(373,86,29);
   for(let i=0;i<24;i++){g.fillStyle(0xc5d8e9,.25+(i%3)*.15);g.fillCircle((i*79+31)%480,(i*43+16)%370,1.3);}
   for(let i=0;i<10;i++){const h=55+(i*47)%120;g.fillStyle(i%2?0x1c3347:0x203b50);g.fillRect(i*54-12,700-h,46,h);for(let j=0;j<4;j++){g.fillStyle(0xe5bb78,.2);g.fillRect(i*54,710-h+j*25,5,9);}}
   const ground=628+this.offset;g.fillStyle(0x3a4d5a);g.fillRect(0,ground,480,72);
   for(const b of this.blocks){const y=b.y+this.offset;g.fillStyle(b.color);g.fillRoundedRect(b.x-b.w/2,y,b.w,32,3);g.fillStyle(0x192f42,.55);for(let x=b.x-b.w/2+12;x<b.x+b.w/2-9;x+=24)g.fillRect(x,y+8,10,15);g.fillStyle(0xffffff,.16);g.fillRect(b.x-b.w/2,y,b.w,3);}
   const width=this.blocks[this.blocks.length-1].w;const ay=this.activeY+this.offset;
   if(!this.falling){g.lineStyle(2,0x99acb9,.7);g.lineBetween(240,0,this.activeX,ay-15);g.lineBetween(this.activeX,ay-15,this.activeX-width/3,ay);g.lineBetween(this.activeX,ay-15,this.activeX+width/3,ay);}
   g.fillStyle(0xf4cc88);g.fillRoundedRect(this.activeX-width/2,ay,width,32,3);g.fillStyle(0x283c4d);for(let x=this.activeX-width/2+12;x<this.activeX+width/2-9;x+=24)g.fillRect(x,ay+8,10,15);
  }
 }
 return new Phaser.Game({type:Phaser.AUTO,parent,width:480,height:700,backgroundColor:'#132539',scene:Tower,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true}});
}
