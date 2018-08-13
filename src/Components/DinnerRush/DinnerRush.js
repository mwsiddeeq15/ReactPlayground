/* eslint-disable no-inline-comments,no-shadow */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as PIXI from 'pixi.js';
import isEqual from 'lodash.isequal';
import './DinnerRush.css';

const speedMultiplier = 2;
const directions = {
  UP: 'up',
  RIGHT: 'right',
  DOWN: 'down',
  LEFT: 'left'
}

export default class DinnerRush extends Component {
  constructor(props) {
    super(props);

    this.state = {
      path: [],
      direction: directions.RIGHT,
    };

    this.onAssetsLoaded = this.onAssetsLoaded.bind(this);
    this.createPath = this.createPath.bind(this);
    this.goToDestination = this.goToDestination.bind(this);
  }

  componentDidMount() {
    if(typeof window !== 'undefined') {
      this.app = new PIXI.Application();
      this.containerNode.appendChild(this.app.view);
      this.app.stop();
      
      PIXI.loader
        .add('customer', 'http://localhost:5001/resources/customer.json')
        .add('fruit', 'http://localhost:5001/resources/fruit.json')
        .load(this.onAssetsLoaded);
    }
  }

  onAssetsLoaded() {
    // create and store the textures
    this.walkingTextures = {
      up: Array.from(new Array(4)).map((_,i)=> PIXI.Texture.fromFrame(`customer-row4-col${ i+1 }`) ),
      right: Array.from(new Array(4)).map((_,i)=> PIXI.Texture.fromFrame(`customer-row3-col${ i+1 }`) ),
      down: Array.from(new Array(4)).map((_,i)=> PIXI.Texture.fromFrame(`customer-row1-col${ i+1 }`) ),
      left: Array.from(new Array(4)).map((_,i)=> PIXI.Texture.fromFrame(`customer-row2-col${ i+1 }`) )
    }

    const fruitTexture = PIXI.Texture.fromFrame(`fruit-row1-col1`);
    this.fruit = new PIXI.Sprite(fruitTexture);
    this.fruit.x = this.app.screen.width/6;
    this.fruit.y = this.app.screen.height/2;
    this.fruit.anchor.set(0.5);
    this.fruit.interactive = true;
    this.fruit.on('click', (e) => {
      this.goToDestination(e.target);
    })
    this.app.stage.addChild(this.fruit);


    const fruitTexture2 = PIXI.Texture.fromFrame(`fruit-row1-col2`);
    this.fruit2 = new PIXI.Sprite(fruitTexture2);
    this.fruit2.x = this.app.screen.width - 60;
    this.fruit2.y = this.app.screen.height - 60;
    this.fruit2.anchor.set(0.5);
    this.fruit2.interactive = true;
    this.fruit2.on('click', (e) => {
      this.goToDestination(e.target);
    })
    this.app.stage.addChild(this.fruit2);

    this.customer = new PIXI.extras.AnimatedSprite(this.walkingTextures.right);
    this.customer.x = this.app.screen.width/4;
    this.customer.y = this.app.screen.height/4;
    this.customer.anchor.set(0.5);
    this.customer.animationSpeed = .1 * speedMultiplier;
    this.customer.play();
    
    this.app.ticker.add(() => {

      const { path } = this.state;

      if(path.length > 0) {
        if(!this.customer.playing) {
          this.customer.gotoAndPlay(1);
        }

        this.followPath(path);
      } else {
        this.customer.gotoAndStop(0);
      }
    });

    this.app.stage.addChild(this.customer);

    // start animating
    this.app.start();
  }

  goToDestination(target) {
    // if(this.state.path.length === 0) {
      this.state.path = this.createPath(target);
    // }
  }

  setTexture(dx, dy) {
    let textures;
    const key = `${dx}, ${dy}`;

    switch(key) {
      case '-1, 0': // Left
        textures = this.walkingTextures.left;
        break;
      case '0, -1':// Up
        textures = this.walkingTextures.up;
        break;
      case '1, 0':// Right
        textures = this.walkingTextures.right;
        break;
      case '0, 1':// Down
        textures = this.walkingTextures.down;
        break;
      default:
        console.log('UH OH: ', key)
    }

    if(!isEqual(this.customer.textures, textures)) {
      this.customer.textures = textures
    }
  }

  createPath(destination) {
    const x0 = this.customer.x;
    const y0 = this.customer.y;
    const { x, y } = destination;

    return [
      ...this.unitVectors([ x - x0, 0 ]),
      ...this.unitVectors([ 0, y - y0 ])
    ]
  }

  unitVectors(vector) {
    const x = vector[0]/Math.abs(vector[0]) || 0;
    const y = vector[1]/Math.abs(vector[1]) || 0;
    let length = Math.abs(vector[0]) || Math.abs(vector[1]);
    length = parseInt(length/speedMultiplier, 10);

    return Array.from(new Array(length)).map((_) => [ x, y ] )
  }

  /**
   * [ 
   *   [ 0, 1 ],
   *   [ 0, 1 ],
   *   [ -1, 0 ]
   *  ]
   */
  followPath(path) {
    if(path.length > 0) {
      const [ dx, dy ] = path.shift();

      this.walk(dx, dy);
    }
  }

  // Either change Y or X NOT both!
  walk(dx,dy) {
    const { x, y } = this.customer;
    const x0 = 20;
    const y0 = 20;
    const xf = this.app.screen.width - 20;
    const yf = this.app.screen.height - 20;
    const newX = dx ? Math.min(Math.max(x0, x + dx * speedMultiplier), xf) : null;
    const newY = dy ? Math.min(Math.max(y0, y + dy * speedMultiplier), yf) : null;

    this.setTexture(dx, dy);

    if(newX) {
      this.customer.x = newX;
    }

    if(newY) {
      this.customer.y = newY;
    }
  }

  render() {
   return (
    <div 
      className="DinnerRush"
      ref={ (ref) => { this.containerNode = ReactDOM.findDOMNode(ref); } }
    >
    </div>
   );
  }
}
