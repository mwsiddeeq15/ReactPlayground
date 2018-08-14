/* eslint-disable no-inline-comments,no-shadow */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as PIXI from 'pixi.js';
import isEqual from 'lodash.isequal';
import { getLevelConfig } from './config';
import './DinnerRush.css';

const speedMultiplier = 3;
const storePadding = 50;
const itemSpacing = 75;
const aisleSpacing = 150;
const aisleOffset = -60;
const listItemSpacing = 15;
const directions = {
  UP: 'up',
  RIGHT: 'right',
  DOWN: 'down',
  LEFT: 'left'
}


export default class DinnerRush extends Component {
  constructor(props) {
    super(props);

    const level = 1;
    this.config = getLevelConfig(level);
    const { shoppingList } = this.config;

    this.state = {
      level,
      shoppingList,
      walking: false,
      direction: directions.DOWN,
      startPoint: {},
      endPoint: {},
      path: [],
      numberOfItems: 0
    };

    this.onAssetsLoaded = this.onAssetsLoaded.bind(this);
    this.createPath = this.createPath.bind(this);
    this.goToDestination = this.goToDestination.bind(this);
    this.addToTicker = this.addToTicker.bind(this);
    this.setListeners = this.setListeners.bind(this);
    this.detectCollisions = this.detectCollisions.bind(this);
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

      this.app.ticker.add(this.addToTicker);
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

    // add background
    const backgroundTexture = PIXI.Texture.fromImage('http://localhost:5001/resources/floor.jpg')
    const backgroundTextureForSprite = new PIXI.Texture(backgroundTexture, new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height));
    const background = new PIXI.Sprite(backgroundTextureForSprite);
    background.anchor.x = 0;
    background.anchor.y = 0;
    background.position.x = 0;
    background.position.y = 0;
    this.app.stage.addChild( background );

    // add shelves
    const shelfTexture = PIXI.Texture.fromImage('http://localhost:5001/resources/shelf.png')
    const shelfTextureForSprite = new PIXI.Texture(shelfTexture, new PIXI.Rectangle(0, 0, 64, 61));
    const addShelf = ((texture, scaleX, scaleY, anchorX = 0, anchorY = 0, positionX = 0, positionY) => {
      const shelf = new PIXI.Sprite(shelfTextureForSprite);
      shelf.scale.x += scaleX;
      shelf.scale.y += scaleY;
      shelf.anchor.x = anchorX;
      shelf.anchor.y = anchorY;
      shelf.position.x = positionX;
      shelf.position.y = positionY;
      this.app.stage.addChild( shelf );
      return shelf;
    })

    const bottomShelf = addShelf(shelfTextureForSprite, 7, 0.5, 0, 0, 0, 450);
    const middleShelf = addShelf(shelfTextureForSprite, 7, 0.5, 0, 0, 0, 250);
    const topShelf = addShelf(shelfTextureForSprite, 7, 0.5, 0, 0, 0, 50);

    // Initialize static and interactive items
    this.initItems();
    // Initialize shopping
    this.initShoppingList();

    this.customer = new PIXI.extras.AnimatedSprite(this.walkingTextures[this.state.direction]);
    this.customer.x = this.app.screen.width - 275;
    this.customer.y = this.app.screen.height - 75;
    this.customer.anchor.set(0.5, 0);
    this.customer.animationSpeed = 0.1 * speedMultiplier;
    this.app.stage.addChild(this.customer);

    this.app.ticker.add(() => {

      const { path, walking, direction } = this.state;

      if(path.length > 0) {
        if(!this.customer.playing) {
          this.customer.gotoAndPlay(1);
        }

        this.walkPath(path);
      } else {
        if(this.onPathComplete) {
          this.onPathComplete();
          this.onPathComplete = null;
        }
        else if(walking) {
          if(!this.customer.playing) {
            this.customer.gotoAndPlay(1);
          }
  
          switch(direction) {
            case directions.UP:
              this.walk(0, -1);
              break;
            case directions.RIGHT:
              this.walk(1, 0);
              break;
            case directions.DOWN:
              this.walk(0, 1);
              break;
            case directions.LEFT:
              this.walk(-1, 0);
              break;
          }
        }
        else {
          this.customer.gotoAndStop(0);
        }
      }
      
      this.setListeners();
      this.refreshItems();
    });

    // start animating
    this.app.start();
  }

  setListeners() {
    window.addEventListener('keydown', (e) => {
      switch(e.keyCode) {
        case 37:
        case 65:
          this.state.walking = true;
          this.state.direction = directions.LEFT;
          break;
        case 38:
        case 87:
          this.state.walking = true;
          this.state.direction = directions.UP;
          break;
        case 39:
        case 68:
          this.state.walking = true;
          this.state.direction = directions.RIGHT;
          break;
        case 40:
        case 83:
          this.state.walking = true;
          this.state.direction = directions.DOWN;
          break;
        default:
          console.log('Key: ', e.keyCode)
      }
    });

    window.addEventListener('keyup', (e) => {
      this.state.walking = false;
    });
  }

  initItems() {
    this.items = this.config.storeItems.map((item) => {
      const { position, active, name } = item;
      const [ x, y ] = position;

      const sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(item.sprite));
      sprite.x = storePadding + itemSpacing * x;
      sprite.y = this.app.screen.height - (storePadding + aisleOffset +aisleSpacing * y);
      sprite.anchor.set(0.5, 1);
      sprite.interactive = true;

      sprite.on('click', (e) => {
        this.goToDestination(e.target, 'y', () => {
          
          setTimeout(() => {
            this.goToDestination(this.state.startPoint, 'x', () => { 
              this.customer.textures = this.walkingTextures.down;
              this.state.numberOfItems += 1;
            });
            sprite.renderable = false;
          }, 750);
    
          this.customer.textures = this.walkingTextures.up;
          sprite.interactive = false;
        });
      });

      const isShoppable = this.state.shoppingList.includes(name.toLocaleLowerCase());

      if(active && isShoppable) {
        this.app.stage.addChild(sprite);
      }

      return { ...item, sprite };
    });
  }

  initShoppingList() {
    const { shoppingList } = this.state;

    const style = { fontFamily: 'Arial', fontSize: 18, fill: 0xff1010, align: 'center' };
    const title = new PIXI.Text(`Shopping List:`, style)
    title.x = this.app.screen.width - (storePadding + 125);
    title.y = this.app.screen.height - (storePadding + listItemSpacing * (shoppingList.length + 2));

    this.app.stage.addChild(title);

    this.shoppingList = shoppingList.map((name, index) => {
        const sprite = new PIXI.Text(name, style);
        sprite.x = this.app.screen.width - (storePadding + 100);
        sprite.y = this.app.screen.height - (storePadding + listItemSpacing * (index+1));
  
        this.app.stage.addChild(sprite);

        return {
          name,
          sprite 
        };
    });
  }

  refreshItems() {
    // Update state/status of items, ie: handle removing dead sprites
    this.items.forEach((item) => {
      if(item.sprite.renderable === false) {
        const listItem = this.shoppingList.find(({ name }) => name === item.name)

        listItem.sprite.style.fill = '#D3D3D3';
        this.app.stage.removeChild(item.sprite);
        item.active = false;
      }
    });
  }

  goToDestination(target, initialTravelAxis='y', callback) {
    if(this.state.path.length === 0) {
      this.onPathComplete = callback;

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
  walkPath(path) {
    if(path.length > 0) {
      const [ dx, dy ] = path.shift();

      this.walk(dx, dy);
    }
  }

  addToTicker() {
    // watch for game end state
    if (this.state.numberOfItems === this.state.shoppingList.length) {
      const gameOverTextStyle = { fontFamily : 'Arial', fontSize: 32, fill : '#0067B1', align : 'center' };
      const gameOverText = new PIXI.Text('Shopping Complete!', gameOverTextStyle);
      gameOverText.x = this.app.screen.width/2;
      gameOverText.y = this.app.screen.height/4;
      gameOverText.anchor.set(0.5);
      this.app.stage.addChild(gameOverText);
      this.app.stop();
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