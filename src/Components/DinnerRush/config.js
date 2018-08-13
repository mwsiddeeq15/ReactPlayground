const storeItems = [
  {
    name: 'cherry',
    sprite: 'fruit-row1-col1',
    position: [ 1, 1 ],
    active: true
  },
  {
    name: 'peach',
    sprite: 'fruit-row1-col2',
    position: [ 2, 1 ],
    active: true
  },
  {
    name: 'raddish',
    sprite: 'fruit-row1-col3',
    position: [ 3, 1 ],
    active: true
  },
  {
    name: 'melon',
    sprite: 'fruit-row5-col1',
    position: [ 1, 2 ],
    active: true
  },
  {
    name: 'grapes',
    sprite: 'fruit-row4-col2',
    position: [ 2, 2 ],
    active: true
  },
  {
    name: 'pineapple',
    sprite: 'fruit-row2-col3',
    position: [ 3, 2 ],
    active: true
  }
]

const levelConfig = {

  level_1: {
    storeItems,
    shoppingList: [
      'pineapple',
      'melon',
      'melon'
    ]
  },

  level_2: {
    storeItems,
    shoppingList: [
      'cherry',
      'peach',
      'pineapple',
      'melon'
    ]
  }
};

export function getLevelConfig(level) {
  return levelConfig[`level_${ level }`];
}