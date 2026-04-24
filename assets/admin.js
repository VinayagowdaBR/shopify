theme.SlideshowSection.prototype = _.assignIn({}, theme.SlideshowSection.prototype,{
  onUnload: function(){
    delete theme.slideshows[this.slideshow];
  },
  onBlockSelect: function(evt){
    var $slideshow = $(this.slideshow);
    var $slide = $('.sl' + evt.detail.blockId).index();
    $slideshow.flickity('select', $slide);
    $slideshow.flickity('stopPlayer');
  },
  onBlockDeselect: function(){
    $(this.slideshow).flickity('playPlayer');
  }
});

theme.Quotes.prototype = _.assignIn({}, theme.Quotes.prototype,{
  onUnload: function(){
    delete theme.quotesl[this.quotesl];
  },
  onSelect: function(evt){
    var flkty = $('#Quotes-'+evt.detail.sectionId),
        flktyData = flkty.attr('data-flickity') || '{}';
    flkty.flickity(JSON.parse(flktyData));
  },
  onBlockSelect: function(evt){
    var $quotesl = $('#Quotes-'+evt.detail.sectionId);
    var $slide = $('#qt' + evt.detail.blockId).index();
    $quotesl.flickity({wrapAround: true,groupCells:1});
    $quotesl.flickity('select', $slide);
    $quotesl.flickity('stopPlayer');
  },
  onBlockDeselect: function(evt){
    $('#Quotes-'+evt.detail.sectionId).flickity('playPlayer');
  }
});
theme.Product.prototype = _.assignIn({}, theme.Product.prototype,{
  onUnload: function(){
    delete theme.Product[this.Product];
  },
  onSelect: function(evt){
    var option = $('.primgSlider').attr("data-flickity") || '{}';
    var flkty = new Flickity('.primgSlider',JSON.parse(option));
    if (theme.mlcurrency){ currenciesChange(".priceSingle span.money"); }
  },
  onBlockSelect: function(evt){
    var option = $('.primgSlider').attr("data-flickity") || '{}';
    var flkty = new Flickity('.primgSlider',JSON.parse(option));
    if (theme.mlcurrency){ currenciesChange(".priceSingle span.money"); }
  },
  onBlockDeselect: function(){
    if (theme.mlcurrency){ currenciesChange(".priceSingle span.money"); }
  }
});
theme.carousel.prototype = _.assignIn({}, theme.carousel.prototype,{
  onUnload: function(){
    delete theme.slcarousel[this.slcarousel];
  },
  onSectionLoad: function(evt){
      var flktyData = this.slcarousel.attr('data-flickity');
        if(this.slcarousel.length){
            this.slcarousel.flickity(JSON.parse(flktyData));
        }
  },
  onSelect: function(evt){
    var flktyData = this.slcarousel.attr('data-flickity');
    if(this.slcarousel.length){
        this.slcarousel.flickity(JSON.parse(flktyData));
    }
    $('#shopify-section-'+evt.detail.sectionId).addClass('actSec');
    if($('.exitprPopup .excarousel').length){
        var option = $('.exitprPopup .excarousel').attr("data-flickity") || '{}';
        $('.exitprPopup .excarousel').flickity(JSON.parse(option));
    }
  },
  onDeselect: function(evt){
    $('#shopify-section-'+evt.detail.sectionId).removeClass('actSec');
  },
  onBlockSelect: function(evt){
    var $carousel = $(this.slcarousel),
        $slide = $('#' + evt.detail.blockId).index();
    $carousel.flickity({wrapAround: true,groupCells:1});
    $carousel.flickity('select', $slide);
    $carousel.flickity('stopPlayer');
  },
  onBlockDeselect: function(){
    $(this.carousel).flickity('playPlayer');
  },
  register: function(evt){
    
  }
});
