class Group {
    constructor(name) {
        this.name = name;
        this.cards = [];
    }
    addCard(card) {
        this.cards.push(card);
        card.group = this;
    }
    removeCard(card) {
        let idx = this.cards.indexOf(card);
        if (idx>=0) {
            this.cards.splice(idx, 1);
        }
    }
    hasCard(card) {
        let idx = this.cards.indexOf(card);
        return idx >= 0;
    }
    get isNull() {
        return false;
    }
    asJson() {
        return {
            name: this.name,
            isNull: this.isNull,
            cards: this.cards.map(c=>c.asJson())
        }
    }
}

class NullGroup extends Group {
    constructor() {
        super("קלפים ללא רביעיה");
    }
    get isNull() {
        return true;
    }
}

class Card {
    constructor(group, url) {
        this.url = url;
        group.addCard(this);
        this.name = null;
    }
    asJson() {
        return {
            url: this.url,
            name: this.name,
        }
    }
    get index() {
        return this.group.cards.indexOf(this);
    }
    get y() {
        let y = 350 + this.index*20;
        return y;
    }
}


export default class StartController {
    constructor(Upload, $sce, $interval) {
        'ngInject';
        window.main = this;
        this.$sce = $sce
        this.Upload = Upload;
        this.$interval = $interval;
        this.nullGroup = new NullGroup();
        this.groups = [this.nullGroup];
        this.restore();
        // this.savePromise = $interval(() => {
        //     this.save();
        // }, 10000)
    }



    uploadFiles(files) {
        for (let f of files) {
            this.Upload.base64DataUrl(f).then(url => {
                this.$sce.trustAsUrl(url);
                new Card(this.nullGroup, url)
            })
        }
        this.save();
    }
    removeCard(card) {
        console.log("In remove card...")
        card.group.removeCard(card);
        this.save();
    }
    createGroup() {
        let n = this.newGroupName;
        this.groups.push(new Group(n));
        this.newGroupName = null;
        this.save();
    }
    newGroupFormOk() {
        if (!this.newGroupName) {
            return false;
        }
        if (this.groups.filter(g=>g.name==this.newGroupName).length > 0) {
            return false;
        }
        return true;
    }
    cardGroupChanged(card) {
        let curGroup = card.group;
        console.log(curGroup);
        for (let g of this.groups) {
            g.removeCard(card);
        }
        curGroup.addCard(card);
        this.save();
    }
    save() {
        //this.doSave()
    }
    doSave() {
        console.log("saving");
        let data = angular.toJson(this.groups.map(g=>g.asJson()));
        window.localStorage.setItem("fours-groups",data);
    }
    restore() {
        let data = window.localStorage.getItem("fours-groups");
        if (data) {
            this.groups = angular.fromJson(data).map(g=>this.restoreGroup(g))
            this.nullGroup = this.groups.filter(g=>g.isNull==true)[0];
        }
    }
    restoreGroup(g) {
        let n = g.name;
        let group = g.isNull ? new NullGroup() : new Group(n);
        for (let c of g.cards) {
            let card = new Card(group, c.url);
            card.name = c.name;
        }
        return group;
    }
    restart() {
        this.nullGroup = new NullGroup();
        this.groups = [this.nullGroup];
        this.save();
    }
}



