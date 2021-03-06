import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

class Named {
    get nameParts() {
        if (!this.name) {
            return [""]
        }
        return this.name.split(" ");
    }
}

class Group extends Named {
    constructor(name) {
        super();
        this.name = name;
        this.cards = [];
    }

    addCard(card) {
        this.cards.push(card);
        card.group = this;
    }

    removeCard(card) {
        let idx = this.cards.indexOf(card);
        if (idx >= 0) {
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
            cards: this.cards.map(c => c.asJson())
        }
    }

    get moveToTitle() {
        return 'העבר ל' + '' + this.name;
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

class Card extends Named {
    constructor(id, group, url) {
        super()
        this.url = url;
        group.addCard(this);
        this.name = null;
        this.id = id;
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
        let y = 350 + this.index * 20;
        return y;
    }

    get divId() {
        return `game-card-${this.id}`;
    }
}


export default class StartController {
    constructor($scope, Upload, $q, $sce, $interval) {
        'ngInject';
        window.main = this;
        this.$sce = $sce;
        this.$scope = $scope;
        this.Upload = Upload;
        this.$interval = $interval;
        this.$q = $q;
        this.lastCardId = 0;
        this.nullGroup = new NullGroup();
        this.groups = [this.nullGroup];

        this.restore();
        // this.savePromise = $interval(() => {
        //     this.save();
        // }, 10000)

    }

    getCardId() {
        this.lastCardId++;
        return this.lastCardId;
    }


    uploadFiles(files) {
        console.log("uploading...")
        for (let f of files) {
            this.Upload.base64DataUrl(f).then(url => {
                this.$sce.trustAsUrl(url);
                new Card(this.getCardId(), this.nullGroup, url)
            })
        }
        this.save();
    }

    removeCard(card) {
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
        if (this.groups.filter(g => g.name == this.newGroupName).length > 0) {
            return false;
        }
        return true;
    }

    cardGroupChanged(card) {
        let curGroup = card.group;
        for (let g of this.groups) {
            g.removeCard(card);
        }
        curGroup.addCard(card);
        this.save();
    }

    save() {
        this.saveToLocalStorage()
    }

    saveToLocalStorage() {
        console.log("saving");
        let data = angular.toJson(this.groups.map(g => g.asJson()));
        window.localStorage.setItem("fours-groups", data);
    }

    saveToJson() {
        this.saveToLocalStorage();
        let text = window.localStorage.getItem("fours-groups");
        let textBlob = new Blob([text], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(textBlob, "dump.json");
    }



    restore() {
        let data = window.localStorage.getItem("fours-groups");
        this.restart();
        if (data) {
            this.restoreFromString(data);
        }
    }

    restoreFromString(data) {
        this.groups = angular.fromJson(data).map(g => this.restoreGroup(g))
        this.nullGroup = this.groups.filter(g => g.isNull == true)[0];
        this.saveToLocalStorage();
    }

    restoreFromJson($file) {
        let fr = new FileReader()
        fr.readAsText($file);
        fr.onload = () => {
            this.$scope.$apply(() => {
                this.inRestoreFromJson = false;
                this.restoreFromString(fr.result);
            });
        }
    }

    restoreGroup(g) {
        let n = g.name;
        let group = g.isNull ? new NullGroup() : new Group(n);
        for (let c of g.cards) {
            let card = new Card(this.getCardId(), group, c.url);
            card.name = c.name;
        }
        return group;
    }

    restart() {
        this.nullGroup = new NullGroup();
        this.groups = [this.nullGroup];
        this.save();
    }

    draw() {
        this.saveToLocalStorage()
        this.printMode = true;
        this.zipUrl = null;
        let zip = new JSZip();
        let promises = [];
        for (let g of this.groups) {
            for (let c of g.cards) {
                promises.push(this.drawCard(zip, c));
            }
        }
        let main = this;
        this.$q.all(promises).then(() => {
            console.log("all done");
            let $scope = this.$scope;
            zip.generateAsync({type: "blob"})
                .then(function (content) {
                    FileSaver.saveAs(content, "game.zip");
                    main.zipUrl = URL.createObjectURL(content);
                    main.printMode = false;
                    $scope.$apply();
                    // window.setTimeout(function() {
                    //     let a = document.getElementById("zip-download");
                    //     a.href = main.zipUrl;
                    //     a.download = "game.zip";
                    // }, 1000);
                });
        })
    }

    drawCard(zip, c) {
        let defer = this.$q.defer();
        let images = document.getElementById("images");
        let div = document.getElementById(c.divId);
        let $scope = this.$scope;
        html2canvas(div).then(canvas => {
            canvas.toBlob(function (blob) {
                zip.file(`card_${c.id}.png`, blob);
                console.log(`${c.id} done`);
                $scope.$apply(function () {
                    defer.resolve();
                });
            });
        });
        return defer.promise;
    }
}



