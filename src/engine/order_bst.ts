// an implementation of a binary search tree using a linked list as queue as nodes
// each order is stored in a queue, and the queue is stored in a node of the tree

import { Order } from "./order_matching";

class OrderQueueNode {
    public order: Order;
    public next: OrderQueueNode | null;

    constructor(order: Order, next=null) {
        this.order = order;
        this.next = next;
    }

    public get_order(): Order {
        return this.order;
    }

    public get_next(): OrderQueueNode | null {
        return this.next;
    }
}

class OrderQueue {
    private price: number;
    private head: OrderQueueNode | null;
    private tail: OrderQueueNode | null;

    constructor(price) {
        this.price = price;
        this.head = null;
        this.tail = null;
    }

    public get_price(): number {
        return this.price;
    }

    public enqueue(order: Order) {
        const node = new OrderQueueNode(order);
        if(this.head === null && this.tail === null) {
            this.head = node;
            this.tail = node;
        } else if(this.tail !== null) {
            this.tail.next = node;
            this.tail = node;
        }
    }

    public dequeue(): Order | null {
        if(this.head === null) {
            return null;
        }
        const order = this.head.get_order();
        this.head = this.head.get_next();
        return order;
    }

    public peek(): Order | null {
        if(this.head === null) {
            return null;
        }
        return this.head.get_order();
    }

    public is_empty(): boolean {
        return this.head === null;
    }

    public into_array(): Order[] {
        let node = this.head;
        const array: Order[] = [];
        while(node !== null) {
            const order: Order = node.get_order()
            array.push(order);
            node = node.get_next();
        }
        return array;
    }

}

class OrderQueueTreeNode {
    public order_queue: OrderQueue;
    public left: OrderQueueTreeNode | null;
    public right: OrderQueueTreeNode | null;

    constructor(price, left=null, right=null) {
        this.order_queue = new OrderQueue(price);
        this.left = left;
        this.right = right;
    }

    public get_price(): number {
        return this.order_queue.get_price();
    }

    public enqueue(order: Order) {
        this.order_queue.enqueue(order);
    }
}

export class OrderBST {
    private root: OrderQueueTreeNode | null;

    constructor() {
        this.root = null;
    }

    public push(order: Order) {
        const price = order.price;
        const node = this.root;
        if(node === null) {
            this.root = new OrderQueueTreeNode(price);
            this.root.enqueue(order);
            return;
        } else {
            function search_tree(node: OrderQueueTreeNode) {
                if (order.price < node.get_price()) {
                    if(node.left === null) {
                        node.left = new OrderQueueTreeNode(price);
                        node.left.enqueue(order);
                        return;
                    } else if (node.left !== null) {
                        return search_tree(node.left);
                    }
                } else if (order.price > node.get_price()) {
                    if(node.right === null) {
                        node.right = new OrderQueueTreeNode(price);
                        node.right.enqueue(order);
                        return;
                    } else if (node.right !== null) {
                        return search_tree(node.right);
                    }
                } else {
                    node.enqueue(order);
                    return;
                }
            };
            return search_tree(node);
        }
    }

    public pop(): Order | null {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.left !== null) {
            current = current.left;
        }
        const order = current.order_queue.dequeue();
        if(current.order_queue.is_empty()) {
            this.remove(current.get_price());
        }
        return order;
    }

    public extract(price: number): Order | null {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.get_price() !== price) {
            if(price < current.get_price()) {
                current = current.left;
            } else {
                current = current.right;
            }
            if(current === null) {
                return null;
            }
        }
        const order = current.order_queue.dequeue();
        if(current.order_queue.is_empty()) {
            this.remove(current.get_price());
        }
        return order;
    }

    public remove(price: number) { //will remove the whole node even if the queue is not empty
        function remove_node(node: OrderQueueTreeNode | null, price: number): OrderQueueTreeNode | null {
            if(node === null) {
                return null;
            }
            if(price === node.get_price()) {
                if(node.left === null && node.right === null) {
                    return null;
                }
                if(node.left === null) {
                    return node.right;
                }
                if(node.right === null) {
                    return node.left;
                }
                let temp_node = node.right;
                while(temp_node.left !== null) {
                    temp_node = temp_node.left;
                }
                node.order_queue = temp_node.order_queue;
                node.right = remove_node(node.right, temp_node.get_price());
                return node;
            } else if(price < node.get_price()) {
                node.left = remove_node(node.left, price);
                return node;
            } else {
                node.right = remove_node(node.right, price);
                return node;
            }
        }
        this.root = remove_node(this.root, price);
    }

    public find_min(): OrderQueue | null {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.left !== null) {
            current = current.left;
        }
        return current.order_queue;
    }

    public find_max(): OrderQueue | null {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.right !== null) {
            current = current.right;
        }
        return current.order_queue;
    }

    public find(price: number): OrderQueue | null {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.get_price() !== price) {
            if(price < current.get_price()) {
                current = current.left;
            } else {
                current = current.right;
            }
            if(current === null) {
                return null;
            }
        }
        return current.order_queue;
    }

    public is_empty(): boolean {
        return this.root === null;
    }

    public into_array(): Order[] {
        let array: Order[] = [];
        function traverse(node: OrderQueueTreeNode | null) {
            if(node !== null) {
                traverse(node.left);
                array = array.concat(node.order_queue.into_array());
                traverse(node.right);
            }
            return;
        }
        traverse(this.root);
        return array;
    }
}

export class BSTTests {
    public static test() {
        // Create sample orders
        const order1 = {
            id: 1,
            owner_id: 1,
            market_id: 1,
            market_symbol: "BTC/USD",
            side: true,
            price: 50000,
            amount: 1,
            filled: 0,
            status: 0,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const order4 = {
            id: 4,
            owner_id: 1,
            market_id: 1,
            market_symbol: "BTC/USD",
            side: true,
            price: 50000,
            amount: 1,
            filled: 0,
            status: 0,
            created_at: new Date(),
            updated_at: new Date(),
        };
        
        const order2 = {
            id: 2,
            owner_id: 2,
            market_id: 1,
            market_symbol: "ETH/USD",
            side: true,
            price: 4000,
            amount: 5,
            filled: 0,
            status: 0,
            created_at: new Date(),
            updated_at: new Date(),
        };
        
        const order3 = {
            id: 3,
            owner_id: 3,
            market_id: 1,
            market_symbol: "BTC/USD",
            side: false,
            price: 48000,
            amount: 2,
            filled: 0,
            status: 0,
            created_at: new Date(),
            updated_at: new Date(),
        };
        
        // Create an instance of the OrderBST
        const orderBST = new OrderBST();
        
        // Test pushing orders into the BST
        orderBST.push(order1);
        orderBST.push(order2);
        orderBST.push(order3);
        orderBST.push(order4);
        
        // Test finding the minimum and maximum prices
        const minPriceQueue = orderBST.find_min();
        console.log("Minimum price queue:", minPriceQueue);
        
        const maxPriceQueue = orderBST.find_max();
        console.log("Maximum price queue:", maxPriceQueue);
        
        // Test finding a specific price queue
        const specificPriceQueue = orderBST.find(50000);
        console.log("Specific price queue (50000):", specificPriceQueue);
        
        // Test popping an order from the BST
        const poppedOrder = orderBST.pop();
        console.log("Popped order:", poppedOrder);
        
        // Test extracting an order from the BST based on price
        const extractedOrder = orderBST.extract(4000);
        console.log("Extracted order (price 4000):", extractedOrder);
        
        // Test converting the BST to an array
        const orderArray = orderBST.into_array();
        console.log("Order array:", orderArray);
        
        // Test removing a specific price queue from the BST
        orderBST.remove(50000);
        
        // Test checking if the BST is empty
        const isEmpty = orderBST.is_empty();
        console.log("Is BST empty:", isEmpty);
    }
}