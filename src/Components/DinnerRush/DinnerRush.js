/* eslint-disable no-inline-comments,no-shadow */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as PIXI from 'pixi.js';
import isEqual from 'lodash.isequal';
import './DinnerRush.css';

const speedMultiplier = 2;

export default class DinnerRush extends Component {
  constructor(props) {
    super(props);

    this.state = {
      startPoint: {},
      endPoint: {},
      path: []
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

    // Initialize static and interactive items
    this.initItems();

    this.customer = new PIXI.extras.AnimatedSprite(this.walkingTextures.right);
    this.customer.x = this.app.screen.width/4;
    this.customer.y = this.app.screen.height/4;
    this.customer.anchor.set(0.5);
    this.customer.animationSpeed = 0.1 * speedMultiplier;
    this.app.stage.addChild(this.customer);

    this.app.ticker.add(() => {

      const { path } = this.state;

      if(path.length > 0) {
        if(!this.customer.playing) {
          this.customer.gotoAndPlay(1);
        }

        this.followPath(path);
      } else {
        this.customer.textures = this.walkingTextures.down;
        this.customer.gotoAndStop(0);
      }
      
      this.refreshItems();
    });

    // start animating
    this.app.start();
  }

  initItems() {
    this.items = [
      {
        name: 'Cherry',
        sprite: new PIXI.Sprite(PIXI.Texture.fromFrame(`fruit-row1-col1`)),
        position: [ .2, .7 ],
        active: true
      },
      {
        name: 'Peach',
        sprite: new PIXI.Sprite(PIXI.Texture.fromFrame(`fruit-row1-col2`)),
        position: [ .9, .9 ],
        active: true
      },
      {
        name: 'fdsgs',
        sprite: new PIXI.Sprite(PIXI.Texture.fromFrame(`fruit-row1-col3`)),
        position: [ .5, .5 ],
        active: true
      }
    ];

    this.items.forEach((item) => {
      const { sprite, position, active } = item;

      sprite.x = this.app.screen.width * position[0];
      sprite.y = this.app.screen.height * position[1];
      sprite.anchor.set(0.5);
      sprite.interactive = true;

      sprite.on('click', (e) => {
        this.goToDestination(e.target);
      });

      if(active) {
        this.app.stage.addChild(sprite);
      }
    });
  }

  refreshItems() {
    // Update state/status of items, ie: handle removing dead sprites
    this.items.forEach((item) => {
      if(item.sprite.renderable === false) {
        this.app.stage.removeChild(item.sprite);
        item.active = false;
      }
    });
  }

  goToDestination(target, initialTravelAxis='y') {
    if(this.state.path.length === 0) {
      this.state.startPoint = { x: this.customer.x, y: this.customer.y };
      this.state.endPoint = { x: target.x, y: target.y };
      this.state.path = this.createPath(target, initialTravelAxis);
    }
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

  createPath(destination, initialTravelAxis) {
    const x0 = this.customer.x;
    const y0 = this.customer.y;
    const { x, y } = destination;
    const [ dx, dy ] = [ x - x0,  y - y0 ];

    // initialTravelAxis that the customer travels along can be 'x' or 'y'
    switch(initialTravelAxis.toLowerCase()) {
      case 'x':
        return [
          ...this.unitVectors([ dx, 0 ]),
          ...this.unitVectors([ 0, dy ])
        ];
        break;
      case 'y':
      default:
        return [
          ...this.unitVectors([ 0, dy ]),
          ...this.unitVectors([ dx, 0 ])
        ];
    }
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

  detectCollision(player, item) {
    if (item.interactive === false) return; // Don't detect collision for 'dead' sprites
    if (item.x < player.x + player.width &&
      item.x + item.width > player.x &&
      item.y < player.y + player.height &&
      item.height + item.y > player.y) {
      // collision detected!
      console.log('collision detected');
      // stop the customer from running into the sprite
      this.state.path = [];
      this.goToDestination(this.state.startPoint, 'x');

      item.interactive = false;
      item.renderable = false;
    }
  }

  detectCollisions() {
    this.items.forEach((item) => {
      this.detectCollision(this.customer, item.sprite);
    });
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

    this.detectCollisions();
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
