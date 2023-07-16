// an implementation of a binary search tree using a linked list as queue as nodes
// each order is stored in a queue, and the queue is stored in a node of the tree

import { Order } from "./order_matching";

export class OrderQueueNode {
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

export class OrderQueue {
    private price: number;
    private head: OrderQueueNode | null;
    private tail: OrderQueueNode | null;

    constructor(price) {
        this.price = price;
        this.head = null;
        this.tail = null;
    }

    /**
     * 
     * @returns the price of the queue
     */
    public get_price(): number {
        return this.price;
    }

    /**
     * 
     * @param order the order to be added to the queue
     * @returns void
     */
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

    /**
     * 
     * @returns the order at the head of the queue and removes it from the queue
     */
    public dequeue(): Order | null {
        if(this.head === null) {
            return null;
        }
        const order = this.head.get_order();
        this.head = this.head.get_next();
        return order;
    }

    /**
     * 
     * @param order the order to replace the first order in the queue (the next order to be dequeued)
     * @returns void
     */
    public replace_first(order: Order) {
        if(this.head === null) {
            return;
        }
        this.head.order = order;
    }

    /**
     * 
     * @returns the order at the head of the queue without removing it from the queue
     */
    public peek(): Order | null {
        if(this.head === null) {
            return null;
        }
        return this.head.get_order();
    }

    /**
     * 
     * @returns true if the queue is empty, false otherwise
     */
    public is_empty(): boolean {
        return this.head === null;
    }

    /**
     * 
     * @returns an array of all the orders in the queue in order of insertion
     */
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

export class OrderQueueTreeNode {
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

    /**
     * Adds an order to the queue in the node
     * @param order the order to be added to the queue
     */
    public enqueue(order: Order) {
        this.order_queue.enqueue(order);
    }
}

export class OrderBST {
    private root: OrderQueueTreeNode | null;

    constructor() {
        this.root = null;
    }

    /**
     * 
     * @param order the order to be added to the queue in the BST
     * @returns void
     */
    public insert(order: Order) {
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

    /**
     * 
     * @returns the order at the minimum price in the queue in the BST and removes it from the queue in the BST, removes the node if the queue is empty
     */
    public pop_min(): Order | null {
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

    /**
     * 
     * @returns the order at the maximum price in the queue in the BST and removes it from the queue in the BST, removes the node if the queue is empty
     */
    public pop_max(): Order | null {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.right !== null) {
            current = current.right;
        }
        const order = current.order_queue.dequeue();
        if(current.order_queue.is_empty()) {
            this.remove(current.get_price());
        }
        return order;
    }

    /**
     * 
     * @param price the price of the order to be extracted from the queue in the BST
     * @returns the order at the specified price in the queue in the BST and removes it from the queue in the BST, removes the node if the queue is empty or null if the order is not found
     */
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

    /**
     * Removes a queue node from the BST even if the queue is not empty
     * @param price the price of the order to be removed from the queue in the BST
     * @returns void
     */
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

    /**
     * 
     * @returns the order queue at the minimum price in the queue in the BST without removing it from the BST
     */
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

    /**
     * Replaces the first order in the queue at the minimum price in the BST
     * @param order the order to replace the first order in the queue at the minimum price in the BST
     * @returns void
     */
    public replace_min(order: Order): void {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.left !== null) {
            current = current.left;
        }
        current.order_queue.replace_first(order);
    }

    /**
     * Deletes the first order in the queue at the minimum price in the BST
     * @returns void
     */
    public delete_min(): void {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.left !== null) {
            current = current.left;
        }
        current.order_queue.dequeue();
    }

    /**
     * 
     * @returns the order queue at the maximum price in the queue in the BST without removing it from the BST
     */
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

    /**
     * Replaces the first order in the queue at the maximum price in the BST
     * @param order the order to replace the first order in the queue at the maximum price in the BST
     * @returns void
     */
    public replace_max(order: Order): void {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.right !== null) {
            current = current.right;
        }
        current.order_queue.replace_first(order);
    }

    /**
     * Deletes the first order in the queue at the maximum price in the BST
     * @returns void
     */
    public delete_max(): void {
        let current = this.root;
        if(current === null) {
            return null;
        }
        while(current.right !== null) {
            current = current.right;
        }
        current.order_queue.dequeue();
    }

    /**
     * Finds the order queue at the specified price in the BST without removing it from the BST
     * @param price 
     * @returns the order queue if found else null
     */
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

    /**
     * 
     * @returns true if the BST is empty, false otherwise
     */
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
        orderBST.insert(order1);
        orderBST.insert(order2);
        orderBST.insert(order3);
        orderBST.insert(order4);
        
        // Test finding the minimum and maximum prices
        const minPriceQueue = orderBST.find_min();
        console.log("Minimum price queue:", minPriceQueue);
        
        const maxPriceQueue = orderBST.find_max();
        console.log("Maximum price queue:", maxPriceQueue);
        
        // Test finding a specific price queue
        const specificPriceQueue = orderBST.find(50000);
        console.log("Specific price queue (50000):", specificPriceQueue);
        
        // Test popping an orderMin from the BST
        const poppedOrderMin = orderBST.pop_min();
        console.log("Popped min order:", poppedOrderMin);

        // Test popping an orderMax from the BST
        const poppedOrderMax = orderBST.pop_max();
        console.log("Popped max order:", poppedOrderMax);
        
        // Test extracting an order from the BST based on price
        const extractedOrder = orderBST.extract(50000);
        console.log("Extracted order (price 50000):", extractedOrder);
        
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