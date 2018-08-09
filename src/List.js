import React, { Component } from 'react';
import './App.css';

class List extends Component {
  // Javascript Defined Method
  constructor(props) {
    super(props);

    // Default State
    this.state = {
      items: [ 'Cheese', 'Milk', 'Eggs' ],
      checkedItems: []
    };

    // Forcing local methods to always have the same 'this' context no matter where it is invoked/executed
    this.toggleCheck = this.toggleCheck.bind(this);
    this.addItem = this.addItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  // Our Method
  toggleCheck(e) {
    const { checkedItems } = this.state; // [......]
    const itemText = e.target.innerHTML; // Item1
    const itemIndex = checkedItems.indexOf(itemText); // 0
    console.log(`Toggled ${ itemIndex === -1 ? 'Check' : 'UnChecked' }: `, itemText)

    // Remember if it is "-1" it is NOT in the array!!!!!
    if(itemIndex === -1) {
      // Add it to checkedItems array
      this.setState({
        checkedItems: [
          ...checkedItems,
          itemText
        ]
      });
    } else {
      // Remove it from checkedItems array, by creating new array without the item in it
      this.setState({
        checkedItems: [
          ...checkedItems.slice(0, itemIndex),
          ...checkedItems.slice(itemIndex + 1)
        ]
      });
    }
  }

  // Our Method
  deleteItem(e) {
    const { items } = this.state; // [......]
    const itemText = e.target.innerHTML; // Item3
    const itemIndex = items.indexOf(itemText); // 2 

    console.log("Delete Item: ", itemText);

    this.setState({
      items: [
        ...items.slice(0, itemIndex),
        ...items.slice(itemIndex + 1)
      ]
    });
  }

  // Our Method
  addItem(e) {
    e.preventDefault(); // Stops default 'form submit' page reload

    const { items } = this.state;
    const inputElement = e.target.elements['itemInput'];
    const newItem = inputElement.value;

    console.log("Add Item: ", newItem);

    // New array with new item added
    this.setState({
      items: [
        ...items,
        newItem
      ]
    }, () => {
      inputElement.value = '';
    });
  }

  // React Defined Method
  render() {
    const { items, checkedItems } = this.state;

    return (
      <div>
        <form onSubmit={ this.addItem }>
          <input id="itemInput"/>
        </form>
        <ul>
          {
            items.map((item, index) => { // item => 'Cheese'
              const myStyle = {
                textDecoration: checkedItems.includes(item) ? 'line-through' : 'none'
              }; // line-through or none

              return (
                <li 
                  key={ index }
                  style={ myStyle }
                  onClick={ this.toggleCheck }
                  onDoubleClick={ this.deleteItem }
                >
                  { item }
                </li>
              );
            })
          }
        </ul>
      </div>
    );
  }
}

export default List;