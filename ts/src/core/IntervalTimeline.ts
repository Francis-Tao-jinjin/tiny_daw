import { Vox } from './Vox';

export class IntervalTimeline extends Vox {
    private _root:IntervalNode;
    private _length = 0;

    constructor(){
        super();
        this._root = null;
    }

    public add(event) {
        if (Vox.isUndef(event.time) || Vox.isUndef(event.duration)) {
            throw new Error('IntervalTimeline: events must have time and duration parameters');
        }
        event.time = event.time.valueOf();
        let node = new IntervalNode(event.time, event.time + event.duration, event)
        if (this._root === null) {
            this._root = node;
        } else {
            this._root.insert(node);
        }
        this._length++;
        while (node !== null) {
            node.updateHeight();
            node.updateMax();
            this._rebalance(node);
            node = node.parent;
        }
        return this;
    }

    public remove(event) {
        if (this._root !== null) {
            const result = [];
            this._root.search(event.time, result);
            for (let i = 0; i < result.length; i++) {
                const node = result[i];
                if (node.event === event) {
                    
                }
            }
        }
    }

    private _replaceNodeInParent(node, replacement) {
        if (node.parent !== null) {
            if (node.isLeftChild()) {
                node.parent.left = replacement;
            } else {
                node.parent.right = replacement;
            }
            this._rebalance(node.parent);
        } else {
            this._setRoot(replacement);
        }
    }

    private _removeNode(node) {
        if (node.left === null && node.right === null) {
            this._replaceNodeInParent(node, null);
        } else if (node.right === null) {
            this._replaceNodeInParent(node, node.left);
        } else if (node.left === null) {
            this._replaceNodeInParent(node, node.right);
        } else {
            const balance = node.getBalance();
        }
    }

    private _rotateLeft(node) {
        const parent = node.parent;
        const isLeftChild = node.isLeftChild();

        const pivotNode = node.right;
        node.right = pivotNode.left;
        pivotNode.left = node;

        if (parent !== null) {
            if (isLeftChild) {
                parent.left = pivotNode;
            } else {
                parent.right = pivotNode;
            }
        } else {
            this._setRoot(pivotNode);
        }
    }

    private _rotateRight(node) {
        const parent = node.parent;
        const isLeftChild = node.isLeftChild();

        const pivotNode = node.left;
        node.left = pivotNode.right;
        pivotNode.right = node;

        if (parent !== null) {
            if (isLeftChild) {
                parent.left = pivotNode;
            } else {
                parent.right = pivotNode;
            }
        } else {
            this._setRoot(pivotNode);
        }
    }

    private _setRoot(node) {
        this._root = node;
        if (this._root !== null) {
            this._root.parent = null;
        }
    }

    private _rebalance(node) {
        const balance = node.getBalance();
        if (balance > 1) {
            if (node.left.getBalance() < 0) {
                this._rotateLeft(node.left);
            } else {
                this._rotateRight(node);
            }
        } else {
            if (node.right.getBalance() > 0){
                this._rotateRight(node.right);
            } else {
                this._rotateLeft(node);
            }
        }
    } 

}

class IntervalNode {

    public event:any;
    public low:number;
    public high:number;
    public max:number;
    
    public _left:IntervalNode;
    public _right:IntervalNode;
    public parent:IntervalNode;
    public height:number;

    constructor(low, high, event) {
        this.low = low;
        this.high = high;
        this.event = event;
        
        this.max = this.high;
        this._left = null;
        this._right = null;
        this.parent = null;
        this.height = 0;
    }

    public insert(node:IntervalNode) {
        if (node.low <= this.low) {
            if (this.left === null) {
                this.left = node;
            } else {
                this.left.insert(node);
            }
        } else if (this.right === null) {
            this.right = node;
        } else {
            this.right.insert(node);
        }
    }

    public updateHeight() {
        if (this.left !== null && this.right !== null) {
            this.height = Math.max(this.left.height, this.right.height) + 1;
        } else if (this.right !== null) {
            this.height = this.right.height + 1;
        } else if (this.left !== null) {
            this.height = this.height + 1;
        } else {
            this.height = 0;
        }
    }

    public updateMax() {
        this.max = this.high;
        if (this.left !== null) {
            this.max = Math.max(this.max, this.left.max);
        }
        if (this.right !== null){
            this.max = Math.max(this.max, this.right.max);
        }
    }

    get left() {
        return this._left;
    }

    set left(node) {
        this._left = node;
        if (node !== null) {
            node.parent = this;
        }
        this.updateHeight();
		this.updateMax();
    }

    get right() {
        return this._right;
    }

    set right(node) {
        this.max = this.high;

    }

    public search(value, result) {
        if (value > this.max) {
            return;
        }
        if (this.left !== null) {
            this.left.search(value, result);
        }
        if (this.low <= value && this.high > value) {
            result.push(this);
        }

        if (this.low > value) {
            return;
        }
        if (this.right !== null) {
            this.right.search(value, result);
        }
    }

    public traverse(callback) {
        callback(this);
        if (this.left !== null) {
            this.left.traverse(callback);
        }
        if (this.right) {
            this.right.traverse(callback);
        }        
    }

    public getBalance() {
        let balance = 0;
        if (this.left !== null && this.right !== null) {
            balance = this.left.height - this.right.height;
        } else if (this.left !== null) {
            balance = this.left.height + 1;
        } else if (this.right !== null) {
            balance = this.right.height + 1;
        }
        return balance;
    }

    public isLeftChild() {
        return this.parent !== null && this.parent.left === this;
    }
}