class Series {

}

class Card {
    constructor(url) {
        this.url = url;
        this.name = null;
        this.series = null;
    }
}


export default class StartController {
    constructor(Upload, $sce) {
        'ngInject';
        this.$sce = $sce
        this.Upload = Upload;
        this.serieses = [];
        this.cards = [];
        window.main = this;
    }
    uploadFiles(files) {
        for (let f of files) {
            this.Upload.base64DataUrl(f).then(url => {
                this.$sce.trustAsUrl(url);
                this.cards.push(
                    new Card(url)
                );
            })
        }
    }

}

