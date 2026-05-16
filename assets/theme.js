window.theme = window.theme || {};
theme.Sections = function Sections(){
  this.constructors = {};
  this.instances = [];
  $(document).on('shopify:section:load', this._onSectionLoad.bind(this)).on('shopify:section:unload', this._onSectionUnload.bind(this)).on('shopify:section:select', this._onSelect.bind(this)).on('shopify:section:deselect', this._onDeselect.bind(this)).on('shopify:block:select', this._onBlockSelect.bind(this)).on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};
theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if(_.isUndefined(constructor)){
      return;
    }

    var instance = _.assignIn(new constructor(container),{
      id:id, type:type, container:container
    });
    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if(container){ this._createInstance(container); }
  },

  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance){
      var isEventInstance = (instance.id === evt.detail.sectionId);
      if(isEventInstance){
        if(_.isFunction(instance.onUnload)){
          instance.onUnload(evt);
        }
      }
      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    var instance = _.find(this.instances, function(instance){
      return instance.id === evt.detail.sectionId;
    });
    if(!_.isUndefined(instance) && _.isFunction(instance.onSelect)){
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    var instance = _.find(this.instances, function(instance){
      return instance.id === evt.detail.sectionId;
    });
    if(!_.isUndefined(instance) && _.isFunction(instance.onDeselect)){
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt){
    var instance = _.find(this.instances, function(instance){
      return instance.id === evt.detail.sectionId;
    });
    if(!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)){
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt){
    var instance = _.find(this.instances, function(instance){
      return instance.id === evt.detail.sectionId;
    });
    if(!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)){
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor){
    this.constructors[type] = constructor;
    $('[data-section-type=' + type + ']').each(function(index, container){
      this._createInstance(container, constructor);
    }.bind(this));
  }
});

window.slate = window.slate || {};
slate.rte = {
  wrapTable: function(){
    $('.rte table').wrap('<div class="rte__table-wrapper"></div>');
  },

  iframeReset: function(){
    var $iframeVideo = $('.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]');
    var $iframeReset = $iframeVideo.add('.rte iframe#admin_bar_iframe');

    $iframeVideo.each(function(){
      $(this).wrap('<div class="video-wrapper"></div>');
    });
    $iframeReset.each(function(){
      this.src = this.src;
    });
  }
};
window.slate = window.slate || {};

/*** A11y Helpers * A collection of useful functions that help make your theme more accessible to users with visual impairments. */
slate.a11y = {
  pageLinkFocus: function($element){
    var focusClass = 'js-focus-hidden';
    $element.first().attr('tabIndex', '-1').focus().addClass(focusClass).one('blur', callback);
    function callback(){
      $element.first().removeClass(focusClass).removeAttr('tabindex');
    }
  },
  /*** If there's a hash in the url, focus the appropriate element */
  focusHash: function(){
    var hash = window.location.hash;
    // is there a hash in the url? is it an element on the page?
    if(hash && document.getElementById(hash.slice(1))){
      this.pageLinkFocus($(hash));
    }
  },
  /*** When an in-page (url w/hash) link is clicked, focus the appropriate element */
  bindInPageLinks: function(){
    $('a[href*=#]').on('click', function(evt){
      this.pageLinkFocus($(evt.currentTarget.hash));
    }.bind(this));
  },

  trapFocus: function(options){
    var eventName = options.namespace ? 'focusin.' + options.namespace : 'focusin';

    if(!options.$elementToFocus){
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).off('focusin');

    $(document).on(eventName, function(evt){
      if(options.$container[0] !== evt.target && !options.$container.has(evt.target).length){
        options.$container.focus();
      }
    });
  },
  removeTrapFocus: function(options) {
    var eventName = options.namespace ? 'focusin.' + options.namespace : 'focusin';
    if(options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }
    $(document).off(eventName);
  }
};

/** Currency Helpers * - Accounting.js - http://openexchangerates.github.io/accounting.js/ **/
theme.Currency = (function(){
  var moneyFormat = '${{amount}}'; // eslint-disable-line camelcase

  function formatMoney(cents, format) {
    if(typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || moneyFormat);

    function formatWithDelimiters(number, precision, thousands, decimal){
      precision = precision || 2;
      thousands = thousands || ',';
      decimal = decimal || '.';

      if(isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      var centsAmount = parts[1] ? (decimal + parts[1]) : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney
  }
})();

/* ================ MODULES ================ */
window.theme = window.theme || {};

theme.Header = (function(){
  function init() {
    $(".site-settings").on('click', function(e){
      e.preventDefault();
      $("#settingsBox").toggleClass("active");
    });
    
    $(".hasSub").hover(function(e){
      var submenu = $(this).data('link'),
          othermenu = $(this).closest('.mmWrapper');
      $(othermenu).find('.admmsub:not('+submenu+')').removeClass('active');
      $(othermenu).find(".hasSub").removeClass('active');
      $(submenu).addClass('active');
      $(this).addClass('active');
    });

  	$('#siteNav .lvl1 > a').each(function(){
        if($(this).attr('href') == window.location.pathname) $(this).addClass('active');
    })

  	$('.js-mobile-nav-toggle, .closemmn').on("click",function(){
      body: 'body',
      $('.mobile-nav-wrapper').toggleClass("active");
      $('body').toggleClass("menuOn");
      $('.js-mobile-nav-toggle').toggleClass('open close');
    });
    // Mobile menu: tapping a parent item (one that has a submenu) opens or
    // closes its subcategory dropdown instead of navigating away. Leaf links
    // (no submenu) keep navigating normally. The old +/- icon is no longer
    // required as the trigger — the whole row is tappable.
    $('#MobileNav').on('click', 'li > a', function(e){
		var $a = $(this);
		var $sub = $a.next('ul');
		if ($sub.length){
			e.preventDefault();
			$a.closest('li').toggleClass('open');
			$a.find('.at').first().toggleClass('at-plus-l at-minus-l');
			$sub.stop(true, true).slideToggle();
		}
    });
    // Category sidebar keeps the original +/- icon toggle.
    $('.sidebar_cate .at').on('click', function(e){
		e.preventDefault();
		$(this).toggleClass('at-plus-l at-minus-l');
		$(this).parent().next().slideToggle();
    });

    $("body").click(function(event){
      var $target = $(event.target);
      if(!$target.parents().is('.mobile-nav-wrapper') && !$target.parents().is('.js-mobile-nav-toggle') && !$target.is('.js-mobile-nav-toggle')){
          $('.mobile-nav-wrapper').removeClass("active");
          $('body').removeClass("menuOn");
          $('.js-mobile-nav-toggle').removeClass('close').addClass('open');
      }
      // Hide settingsBox on document click
      if(!$target.parents().is("#settingsBox") && !$target.parents().is(".site-settings") && !$target.is(".site-settings")){
        $("#settingsBox").removeClass("active");
      }
      
      if(!$target.parents().is(".filterbar") && !$target.is(".filterbar") && !$target.is(".btn-filter")){
        $(".filterbar.active").removeClass("active");
      }
    });
  }
  return { init: init };
})();

window.theme = window.theme || {};
theme.Search = (function(){
  function init(){
    // Current Ajax Search request.
    var currentAjaxRequest = null;
    var searchForms = $('form[action="/search"]').each(function(){
      var input = $(this).find('input[name="q"]'),
          slpr = $('#unprod').val();
      input.bind('keyup change', function(){
        var term = $(this).val(),
            form = $(this).closest('form'),
            resultsList = form.find('.search-results');
		if(term.length > 2 ) {
            fetch(`${routes.predictive_search_url}?q=${term}&section_id=predictive-search`)
              .then((response) => {
                if(!response.ok) {
                  var error = new Error(response.status);
                  $(resultsList).hide();
                  $('.s_suggestion').fadeIn();
                  throw error;
                }
                return response.text();
              }).then((text) => {
                var resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
                $(resultsList).html(text).fadeIn();
                $('.s_suggestion').hide();
              }).catch((error) => {
                $(resultsList).hide();
                $('.s_suggestion').show();
                throw error;
              });
    	} else { 
            resultsList.empty().hide(); $('.s_suggestion').show();
        }
      });
    });
    $('.modalOverly, .closeSearch').bind('click', function(){
      $('body').removeClass("showOverly");
      $('#searchPopup').removeClass("active");
    });
    $('.searchIco').on('click', function(e){
      e.preventDefault();
      $('body').addClass("showOverly");
      $('#searchPopup').addClass("active");
      $('input[name=q]').focus();
    });
  }
    return { init:init };
})();
/*================ SECTIONS ================*/
window.theme = window.theme || {};
theme.HeaderSection = (function(){
  function Header() {
    theme.Header.init();
    theme.Search.init();
  }
  Header.prototype = _.assignIn({}, Header.prototype, {
    onUnload: function(){
      theme.Header.unload();
    }
  });
  return Header;
})();



/* eslint-disable no-new */
theme.Product = (function(){
  function Product(container) {
    this.container = container;
    var $container = this.$container = $(container),
    	sectionId = $container.attr('data-section-id');

    this.settings = {
      mediaQueryMediumUp: 'screen and (min-width: 768px)',
      mediaQuerySmall: 'screen and (max-width: 767px)',
      bpSmall: false,
      zoomEnabled: false
    };
    this.selectors={
      ftImg: '.featImg' + sectionId,
      imgWrap: '.pr_zoom_' + sectionId
    }
      
    if(!customElements.get('media-gallery')){
        customElements.define('media-gallery', class MediaGallery extends HTMLElement {
            constructor(){
                super();
            }
            connectedCallback(){
                var secId = this.dataset.section,
                    $carouselNavH = $('.ptw'+secId),
                    $carouselNav = $('.pr_thumbs' + secId),
                    $carouselNavCells = $carouselNav.find('.pr_thumbs_item'),
                    flkty = $('#pis'+secId).data('flickity'),
                    navTop  = $carouselNav.position().top,
                    navLeft  = $carouselNav.position().left,
                    navCellHeight = $carouselNavCells.height(),
                    navCellWidth = $carouselNavCells.width(),
                    navHeight = $carouselNav.height(),
                    navWidth = $carouselNav.width();
                $('#pis'+secId).on( 'select.flickity',function(){
                  $carouselNav.find('.active-thumb').removeClass('active-thumb');
                  var $selected = $carouselNavCells.eq(flkty.selectedIndex).addClass('active-thumb');
                  if($('.thumbs_nav.bottom').length || $(window).width()<767){
                    var scrollX = $selected.position().left + $carouselNavH.scrollLeft() - ( navWidth + navCellWidth) / 2.5;
                    $carouselNavH.animate({scrollLeft: scrollX});
                  } else {
                    var scrollY = $selected.position().top + $carouselNav.scrollTop() - ( navHeight + navCellHeight) / 2.5;
                    $carouselNav.animate({scrollTop: scrollY});
                  }
                });

                var $primgsl = $('#pis'+secId);
                $('.thumbs_nav .previous').on('click', function(){
                    $primgsl.flickity('previous');
                });
                $('.thumbs_nav .next').on('click', function(){
                    $primgsl.flickity('next');
                });

               $(window).on('load', function(e){
                $primgsl.flickity('resize');
                $('.pr_thumb[data-slide="0"] .prvideo').trigger('click');
                 var video = $('.primgSlider .videoSlide.is-selected video').get(0);
                if($(video).length){ video.play(); }
               });

               $primgsl.on('change.flickity', function(event, index){
                 if($(this).find('.videoSlide video').length){ $(this).find('.videoSlide video').get(0).pause(); }
                 var video = $(this).find('.videoSlide.is-selected video').get(0);
                 if($(video).length){ video.play(); }
                 var flkty = $(this).data('flickity');
                 if($(this).find('.is-selected model-viewer').length){
                    flkty.options.draggable = false;
                    flkty.updateDraggable();
                    $('.is-selected .shopify-model-viewer-ui__button--poster').trigger('click')
                 } else {
                    flkty.options.draggable = true;
                    flkty.updateDraggable();
                 }
               });
               let thumb = this.querySelectorAll(".pr_thumb");
                thumb.forEach((thumb)=>{
                 thumb.addEventListener('click',(e)=>{
                     e.preventDefault();
                     this.setActiveMedia(thumb.dataset.target);
                 });
                });
                
                this.setActiveMedia(this.dataset.target);
            }
            setActiveMedia(mediaId){
                var breakpoint = window.matchMedia('(min-width: 768px)'),
                    $primgsl = '#pis'+this.dataset.section;

                const activeMedia = $('.pr_photo[data-id="'+mediaId+'"]').index();
                if(activeMedia != undefined){
                    if(theme.productStrings.prStyle == "2" || theme.productStrings.prStyle == "3" || theme.productStrings.prStyle == "4" ){
                        var imgposition = $('.pr_photo[data-id="'+mediaId+'"]').offset();
                        if($(window).width()>767){
                            $("html, body").animate({ scrollTop: imgposition.top-70 }, 700);
                        } else {
                            $($primgsl).flickity('select', activeMedia);
                        }
                    } else {
                        $($primgsl).flickity('select', activeMedia);
                    }
                }
            }
            
        });
    }
    
    // change variant on image sections
    if(typeof vimgs !== 'undefined'){
      $('.pr_thumb').bind('click', function(e){
            e.preventDefault();
            var mid = $(this).attr('id');
            if(typeof vimgs[mid] !== 'undefined'){
                productOptions.forEach(function (value, i){
                 optionValue = vimgs[mid]['option-'+i];
                  if($('.swatch.pvOpt0').length){
                    if(optionValue !== null && $('.pvOpt'+i+' .swatchInput').filter(function(){ return $(this).val() === optionValue }).length){
                       $(".pvOpt"+i).find('.swatchInput[value="'+optionValue+'"]').trigger('click');
                     }
                  } else {
                    if(optionValue !== null && $('.single-option-selector:eq('+i+') option').filter(function(){ return $(this).text() === optionValue }).length){
                       $('.single-option-selector:eq('+i+')').val(optionValue).trigger('change');
                     }
                  }
              });
            }
      });
    }

    $(".product-info .review").on('click',function(e){
        $(".product-tabs li").removeClass("active");
      	$(".tablink[href='#ptabReview']").parent().addClass("active");
        $(".tab-content").not("#ptabReview").css("display", "none");
        $("#ptabReview").fadeIn();
      	var tabposition = $('#ptabReview').offset();
      	if($(window).width()<767) {
          $("html, body").animate({ scrollTop: tabposition.top-100 }, 700);
        } else{
          $("html, body").animate({ scrollTop: tabposition.top-150 }, 700);
        }
    });

    this.settings.zoomEnabled = $(this.selectors.ftImg).hasClass('js-zoom-enabled');
    this._initBreakpoints();
    this._stringOverrides();
  }

  Product.prototype = _.assignIn({},Product.prototype,{
    _stringOverrides: function(){
      theme.productStrings = theme.productStrings || {};
      $.extend(theme.strings, theme.productStrings);
    },

    _initBreakpoints: function(){
      var self = this;
      enquire.register(this.settings.mediaQuerySmall, {
        match: function(){
          // destroy image zooming if enabled
          if(self.settings.zoomEnabled) {
            _destroyZoom($(self.selectors.productImageWrap));
          }
          self.settings.bpSmall = true;
        },
        unmatch: function(){
          self.settings.bpSmall = false;
        }
      });
      enquire.register(this.settings.mediaQueryMediumUp, {
        match: function(){
          if(self.settings.zoomEnabled) {
            _enableZoom($(self.selectors.imgWrap));
          }
        }
      });
    },

    onUnload: function(){
      this.$container.off(this.settings.namespace);
    }
  });

  function _enableZoom($el){
    $($el).hover(
      function(){
        var zoomUrl = $(this).data('zoom');
        $(this).zoom({url: zoomUrl});
      }, function(){
        $(this).trigger('zoom.destroy');
      }
    );
  }

  function _destroyZoom($el){
    $($el).each(function(){
    	$(this).trigger('zoom.destroy');
     });
  }
  return Product;
})();

theme.tabs = (function(){
  function tabs(container){
    var $container = this.$container = $(container),
        sectionId = $container.attr('data-section-id'),
        tabs = this.tabs = '.product-tabs .tablink';
    
    $(tabs).on('click', function(e){
      e.preventDefault();
        $(this).parent().addClass("active").siblings().removeClass("active");
        var tab = $(this).attr("href");
        $(".tab-content").not(tab).css("display", "none");
        $(tab).fadeIn();
    });
    $('.acor-ttl .tablink').on('click', function(e){
      e.preventDefault();
        $(this).parent().toggleClass("active").next().slideToggle();
      	if($(window).width()<767) {
          var tabposition = $(this).offset();
          $("html, body").animate({ scrollTop: tabposition.top - 80 }, 500);
        }
    });
    $('.product-tabs li:first-child,.tab-container h3:first-child').addClass("active");
	$('.tab-container h3:first-child + .tab-content').show();
  }
  return tabs;
})();

// Product quick view
theme.QuickView = (function(){
  $('body').on( 'click', '.quick-view', function(e){
    $.ajax({
      beforeSend : function (){
        $('body').addClass("loading");
       },
      url: $(this).attr('href'),
      success: function(data) {

        $.magnificPopup.open({
          items: {
            src: '<div class="quick-view-popup mfpbox mfp-with-anim" id="content_quickview">' + data + '</div>',
            type: 'inline'
          },
          removalDelay:500,
          callbacks: {
            beforeOpen: function(){
             $('.stickyHeader').addClass('popup');
              this.st.mainClass = 'mfp-zoom-in';
            },
            open: function(){              
              	shopreviews();
            },
            close: function(){
               $('.stickyHeader').removeClass('popup');
              $( '#content_quickview' ).empty();
            }
          },
        });
      },
      complete: function(){
        $('body').removeClass("loading");
      }
    })
    e.preventDefault();
    e.stopPropagation();
  });
})();

theme.quotesl={};
theme.Quotes = (function(){
  function Quotes(container){
    var $container = this.$container = $(container),
        sectionId = $container.attr('data-section-id'),
        slider = this.quotesl = '#Quotes-' + sectionId;
    if(Shopify.designMode){
        var flktyData = $(slider).attr('data-flickity');
        if(slider.length){
            $(slider).flickity(JSON.parse(flktyData));
            setTimeout( function(){ $(slider).flickity('resize')});
        }
    }
      
  }
  return Quotes;
})();

theme.slideshows={};
theme.SlideshowSection = (function(){
  function SlideshowSection(container){
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id');
    var slideshow = this.slideshow = '#ss' + sectionId;
    $(slideshow).flickity();
    
    var iframes = $(slideshow).find('.embed-player');
    resizePlayer(iframes, 16/9, $(slideshow));
    $(window).on("resize", function(){
      resizePlayer(iframes, 16/9, $(slideshow));
    });
  }
    // Resize player
    function resizePlayer(iframes, ratio, slideshow){
      if(!iframes[0]) return;
      var win = $(slideshow),
          width = win.width(),
          playerWidth,
          height = win.height(),
          playerHeight,
          ratio = ratio || 16/9;

      iframes.each(function(){
        var current = $(this);
        if(width / ratio < height){
          playerWidth = Math.ceil(height * ratio);
          current.width(playerWidth).height(height).css({
            left: (width - playerWidth) / 2,
             top: 0
            });
        } else {
          playerHeight = Math.ceil(width / ratio);
          current.width(width).height(playerHeight).css({
            left: 0,
            top: (height - playerHeight) / 2
          });
        }
      });
    }
    
  return SlideshowSection;
})();

// CATEGORY SLIDER
theme.collectionView = (function(){
  function collectionView(container) {
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id'),
    	sliderSecond = $container.attr('data-section-timeout');
    
    $(document).on('change','#SortBySt',function(e){
		var value = $(this).val();
      	if($("#CollectionFiltersForm").length){
			$("#SortBy").val(value).trigger('change');
        } else {
          if(value.length) {
            window.location.search = 'sort_by='+value;
          } else {
            window.location.href = window.location.href.replace(window.location.search, '');
          }
        }
	});
    
	$(document).on('click', '.change-view', function(e){
      var view = $(this).data('view'),
          currentUrl = document.URL,
          url = new URL(currentUrl);
      url.searchParams.set("type", view); // setting your param
      window.location = url.href;
    });
    $(document).on('change', '.optTag', function(e){
      var URL =  $('.sidebar_tags').data('url'),
          paramString = window.location.search.substring(1),
      	  productFilters = $('input.optTag'),
          newTags = [],
          url = '';

        productFilters.each(function(){
            if($(this).val() && $(this).is(":checked") == true) {
              newTags.push($(this).val());                        
            }
        });
        if(newTags.length){
        	var tags = newTags.join('+');
       		ajaxfilter(URL+'/'+tags+'?'+paramString);
        } else {
          	ajaxfilter(URL+'?'+paramString);
        }
	});
    $(document).on('change', '.flForm .custCheck, .prRange, #SortBy', function(e){
      var URL =  '//'+window.location.hostname+window.location.pathname,
      	formdata = $('#CollectionFiltersForm').serialize();
      //window.location.replace(URL+'?'+formdata);
      ajaxfilter(URL+'?'+formdata);
	});
  	$(document).on('click', 'a.actFilter', function(e){
      e.preventDefault();
      var URL =  '//'+window.location.hostname+$(this).attr('href');
      ajaxfilter(URL);
	});
    $(document).on('click', 'span.actFilter', function(){
      var filter = $(this).attr("data-value");
      $(".filterBox input[value='"+filter+"']").trigger("click");
	});
    $('.flbytags').each(function(){
		var filter = $(this).find("li");
        if(filter.length <= 0){$(this).hide()}
	});
  
  	ajaxfilter = (function(url){
        $.ajax({
          type: 'GET',
          url: url,
          data:{},
          beforeSend:function(){
            $('body').addClass('loading hideOverly');
          },
          complete: function(data){
            $('.productList .grid-products').html($(".productList .grid-products", data.responseText).html());
            $('.filters-toolbar__product-count').html($(".filters-toolbar__product-count", data.responseText).html());
            
           	$('.sidebar_tags').html($(".sidebar_tags", data.responseText).html());
            $('.active-facets').html($(".active-facets", data.responseText).html());

            $('.pagination').html($(".pagination", data.responseText).html());
            if(!$(".pagination", data.responseText).html()){
              $('.pagination').hide();
            } else {
              $('.pagination').show();
            }
            $('.infinitpaginOuter').html($(".infinitpaginOuter", data.responseText).html());
            if(!$(".infinitpaginOuter", data.responseText).html()){
              $('.infinitpagin').remove();
            }
            if(theme.mlcurrency){ currenciesChange("sapn.money"); }
            $('body').removeClass('loading hideOverly');
            if($('.infinitpagin a.infinite').length){infiniteScroll();}
            loadMoreBtn();

            if($('.prRange').length){ priceSlider(); }
            if($('#sideProdSlider').length){ $("#sideProdSlider").flickity(); }

            history.pushState({page: url}, url, url);
          }
        });
    });

    infiniteScroll = function(){
      	var action = 'scroll load';
        $(window).on(action, function(){
          var moreURL = $('.infinitpagin a').attr('href');
          if($('.infinitpagin a.infinite').length){
            var bottom = $('.infinitpagin').offset();
            var docTop = ($(document).scrollTop() + $(window).height() - 50);
            if( docTop > bottom.top){
              $(window).off(action);
              loadMore(moreURL);
            }
          }
        });
    }
    loadMoreBtn = function(){
        $(document).on('click', '.infinitpagin a.loadMore', function(e){
          	e.preventDefault();
          	var moreURL = $(this).attr('href');
			loadMore(moreURL);
        });
    }
    
    loadMore = function(moreURL) {
      if(moreURL.length){
        $.ajax({
          type: 'GET',
          dataType: 'html',
          url: moreURL,
          beforeSend:function(){
          	if($('.infinitpaginOuter').attr('data-type') == "button" ){
            	$('body').addClass('loading hideOverly');
            } else {
              $('.infinitpagin a').show();
            }
          },
          complete: function (data) {
            if($('.productList .grid-products').length){
            	$('.productList .grid-products').append($(".productList .grid-products", data.responseText).html());
            } else {
              	$('.productList .list-view-items').append($(".productList .list-view-items", data.responseText).html());
            }
            if($(".infinitpagin", data.responseText).html()){
            	$('.infinitpagin').html($(".infinitpagin", data.responseText).html());
            } else {
            	$('.infinitpagin').remove();
            }
			if(theme.mlcurrency){ currenciesChange("sapn.money"); }
            if($('.infinitpagin a.infinite').length){
              infiniteScroll();
            }
            $('body').removeClass('loading hideOverly');
          }
        });
      }
    }
    
    $(document).ready(function(){
      infiniteScroll();loadMoreBtn();
    });
  }
  return collectionView;
})();

theme.instagramSection = (function(){
  function instagramSection(container) {
    var $container = this.$container = $(container),
    	sectionId = $container.attr('data-section-id'),
        act = $container.attr('data-act'),
        limit = $container.attr('data-count');
    
    $.ajax({
		url: 'https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,thumbnail_url,caption,children&access_token='+act,
        type: 'GET',
        dataType: "json",
        success: function (res) {
        	var data = res.data,
				igdiv = '#instafeed'+sectionId,
               	html = '',
                bl = bl || true;
			$.each(data, function(index, el){
               if(index >= limit) return 0;
               var img_url = el.thumbnail_url || el.media_url;
               html += '<div class="gitem insta-img"><a rel="nofollow" class="instagram-" href="'+el.permalink+'" target="_blank"><img data-src="' + img_url + '" alt="" class="imgFt lazyload" /></a></div>';
            });
            $(igdiv).html(html);
            if($("#instafeed"+sectionId+".carousel").length){
                var option = $("#instafeed"+sectionId+".carousel").attr("data-flickity1") || '{}';
                var flkty = new Flickity("#instafeed"+sectionId+".carousel",JSON.parse(option));
            }
		}
	});
  }
  return instagramSection;
})();

theme.slcarousel={};
theme.carousel = (function(){
    function carousel(container) {
    	var $container = this.$container = $(container),
          sectionId = $container.attr('data-section-id'),
          carousel = this.slcarousel = $($container).find('.carousel'),
    	  tabs = this.tabs = '#' + sectionId + ' .tablink',
    	  tabcontent = this.tabcontent = '#' + sectionId + ' .tab-content';
    
    if(Shopify.designMode){
        var flktyData = this.slcarousel.attr('data-flickity');
        if(this.slcarousel.length){
            this.slcarousel.flickity(JSON.parse(flktyData));
            setTimeout( function(){ $('.carousel').flickity('resize')});
        }
    }
    $(tabs).on('click', function(e){
        e.preventDefault();
        $(this).parent().addClass("active").siblings().removeClass("active");
        var tab = $(this).attr("href");
        $(tabcontent).not(tab).css("display", "none");
        $(tab).fadeIn().find('.carousel').flickity('resize');
    });
  }
  return carousel;
})();

theme.masonary = (function(){
    function masonary(container){
    	var $container = this.$container = $(container),
          sectionId = $container.attr('data-section-id'),
          masonary = this.masonary = $($container).find('.grid-masonary');
    
      loadMasonary(masonary);
      setTimeout( function(){ loadMasonary(masonary); },1000);
      function loadMasonary(masonary) {
        $(masonary).masonry({
            columnWidth: '.grid-sizer-'+sectionId,
            itemSelector: '.ms-item',
            percentPosition: true
        });
      }
  }
  return masonary;
})();

if(!customElements.get('before-after')){
    customElements.define('before-after', class BeforeAfter extends HTMLElement {
        constructor(){
            super();
            const imageComparisonSlider = this
            this.init(imageComparisonSlider);
        }
   
        setSliderstate(e, element) {
          const sliderRange = document.querySelector('[data-image-comparison-range]');
          if (e.type === 'input') {
            sliderRange.classList.add('comparison-active');
            return;
          }
          sliderRange.classList.remove('comparison-active');
          element.removeEventListener('mousemove', this.moveSliderThumb);
        }

        moveSliderThumb(e) {
          const sliderRange = document.querySelector('[data-image-comparison-range]');
          const thumb = document.querySelector('[data-image-comparison-thumb]');
          let position = e.layerY - 20;

          if (e.layerY <= sliderRange.offsetTop) {
            position = -20;
          }
          if (e.layerY >= sliderRange.offsetHeight) {
            position = sliderRange.offsetHeight - 20;
          }
          thumb.style.top = `${position}px`;
        }

        moveSliderRange(e, element) {
          const value = e.target.value;
          const slider = element.querySelector('[data-image-comparison-slider]');
          const imageWrapperOverlay = element.querySelector('[data-image-comparison-overlay]');

          slider.style.left = `${value}%`;
          imageWrapperOverlay.style.width = `${value}%`;

          element.addEventListener('mousemove', this.moveSliderThumb);
          this.setSliderstate(e, element);
        }

        init(element){
          const sliderRange = element.querySelector('[data-image-comparison-range]');
          if ('ontouchstart' in window === false) {
            sliderRange.addEventListener('mouseup', e => this.setSliderstate(e, element));
            sliderRange.addEventListener('mousedown', this.moveSliderThumb);
          }

          sliderRange.addEventListener('input', e => this.moveSliderRange(e, element));
          sliderRange.addEventListener('change', e => this.moveSliderRange(e, element));
        }
    });
}

theme.ajaxCart = function(){

	$(".continue-shopping, .modalOverly, .closeDrawer").click(function(){
        $(".modal").fadeOut(200);
    	$("body").removeClass("loading showOverly");
    });
    
    $(document).on('click','.add-to-cart', function(e){
        e.preventDefault();
        $('body').addClass('loading');
        $(this).next().find('.cartBtn').trigger('click');
    });
    $(document).on('click','.mbCart', function(e){
        e.preventDefault();
        $('body').addClass('overflow-hidden').find('.ctdrawer').addClass('active');
    });
    
      $(document).on('click touch', '.quickShop', function(e){
          e.preventDefault(); e.stopImmediatePropagation();
          var url = $(this).attr('href'),
              imgwrapper = $(this).parents('.grid-view-item').find(".gview-img"),
              wrapper = $(this).parents(".grid-view-item").find('.shopWrapper');

          $.ajax({
            url: url+'/?section_id=quick-shop',
            dataType: 'html',
            type: 'GET',
            beforeSend:function(){
              $(imgwrapper).append("<i class='at at-spinner4 at-spin'></i>");
              $(imgwrapper).addClass('showLoading');
            },
            success: function(data){
              $(".shopWrapper").removeClass('active').html("");
              $(wrapper).addClass('active').html(data);
            },
            complete: function(data){
              $(imgwrapper).removeClass('showLoading');
              $(imgwrapper).find('.at-spinner4').remove();
              if(theme.mlcurrency){ currenciesChange(".shopWrapper.active .priceSingle span.money"); }
            }
          });
      });
      $(document).on('click touch', '.closeShop', function(e){
        e.preventDefault();
        $(this).parents(".shopWrapper").removeClass("active");
      });

        var cookieName = "wishlistList";
        $(document).on('click', '.addto-wishlist', function(e){
           e.preventDefault();
             var id = $(this).attr('rel');
             if(localStorage.getItem('wishlist') == null){
               var str = '+' +id;
             } else {
               if(localStorage.getItem('wishlist').indexOf(id) == -1) {
                 var str = localStorage.wishlist + '+' + id;
                    str = str.replace('++', '+');
               }
             }
             localStorage.setItem('wishlist', str);
             $(this).find(".at").removeClass('at-heart-l').addClass('at-circle-notch-r at-spin');
             setTimeout(function(){
               $('.wishlist[rel="'+id+'"]').removeClass('addto-wishlist').find('span').text(theme.wlAvailable);
               $('.wishlist[rel="'+id+'"] .at').removeClass('at-circle-notch-r at-spin').addClass('at-heart');
               updateWishlist();
             },1500);
         });
     function updateWishlist(){
         if(localStorage.getItem('wishlist') != null && localStorage.getItem('wishlist') != '+'){
           var str = String(localStorage.getItem('wishlist')).split("+");
           for (var i=0; i<str.length; i++) {
             if(str[i] != ''){
               $('.wishlist[rel="'+str[i]+'"]').removeClass('addto-wishlist').find('span').text(theme.wlAvailable);
               $('.wishlist[rel="'+str[i]+'"] .at').removeClass('at-heart-l').addClass('at-heart');
               $('.favCount').text(i).removeClass('hide');
             }
           }
         }
     }
     updateWishlist();
};
window.addEventListener('DOMContentLoaded',function(){$(theme.ajaxCart);});

$(document).ready(function(){
  var sections = new theme.Sections();
  sections.register('header-section', theme.HeaderSection);
  sections.register('product', theme.Product);
  sections.register('collection-template', theme.collectionView);
  sections.register('productTabs', theme.tabs);
  sections.register('map', theme.Maps);
  sections.register('slideshow-section', theme.SlideshowSection);
  sections.register('carousel', theme.carousel);
  sections.register('quotes', theme.Quotes);
  sections.register('masonary', theme.masonary);
  sections.register('instagram', theme.instagramSection);
});

theme.countdown = function(){
    $(".saleTime, .atCounter").each(function(){
        var $this = $(this), date = $(this).data('date'), countDownDate = new Date(date).getTime();
        var x = setInterval(function(){
            var now = new Date().getTime(),	            
                distance = countDownDate - now,
                days = Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds = Math.floor((distance % (1000 * 60)) / 1000);
            if(days > 99){
                days = ("00" + days).substr(-3);
            } else {
                days = ("00" + days).substr(-2);
            }
            hours = ("00" + hours).substr(-2);
            minutes = ("00" + minutes).substr(-2);
            seconds = ("00" + seconds).substr(-2);

            $($this).find(".days").html(days);
            $($this).find(".hours").html(hours);
            $($this).find(".minutes").html(minutes);
            $($this).find(".seconds").html(seconds);
            if(distance < 0){clearInterval(x); $($this).hide().parents('.timerl').hide(); }
        }, 1000);
      });
}

theme.init = function(){
  slate.rte.wrapTable();
  slate.rte.iframeReset();
  theme.countdown();

  // Common a11y fixes
  slate.a11y.pageLinkFocus($(window.location.hash));

  $('.in-page-link').on('click', function(evt){
    slate.a11y.pageLinkFocus($(evt.currentTarget.hash));
  });

  $('a[href="#"]').on('click', function(evt){
    evt.preventDefault();
  });
};
$(theme.init);

$(document).ready(function(){
  "use strict";
  
	$(document).on('click', '.currencyOpt', function(i){
      $('#CurrencySelector').val($(this).data('value'));
      $('#localization_form').submit();
    });
    $(document).on('click', '.clOtp', function(i){
      var form = $(this).parents('form');
      $(form).find('.slcrlg').val($(this).data('value'));
      $(form).submit();
    });
  
   // LOOKBOOK SHOP 
	$('.btn-shop').click(function(){
       $('.products .list-columns, .grid-lookbook').removeClass('active');
       $(this).next().addClass('active');
       $(this).parents('.grid-lookbook').addClass('active');
	});
	$('.btn-shop-close').click(function(){     
    	$(this).parent().removeClass('active');
	});

  	// PROMOTION HEADER show-hide
    if(getCookie('promotion') == 'true'){
    	$(".notification-bar").slideUp();
  	}
	$(".close-announcement").click(function(){
		$(".notification-bar").slideUp();
        setCookie('promotion','true',1);
	});
  
	// SHOW HIDE PRODUCT Filters
  	$(document).on('click touch', '.btn-filter, .closeFilter', function(){
    	$(".filterbar").toggleClass("active");
	});
	$("body").click(function(event ){
    	var $target = $(event.target);
    	if(!$target.parents().is(".sb_filter") && !$target.is(".sb_filter")&& !$target.is(".btn-filter")){
      		$(".sb_filter").removeClass("active");
    	}
	});
  
  // STICKY HEADER
  window.onscroll = function(){ scrollfunction() };
  function scrollfunction(){
	if(theme.fixedHeader){
		if($(window).scrollTop()>145) {     
            $('#header').addClass("stickyHeader animated fadeInDown");
          	$('.stickySpace').css("min-height",$('#header').height());
    	} else {
            $('#header').removeClass("stickyHeader fadeInDown");
          	$('.stickySpace').css("min-height",'');
        }
    }
    
    /// sticky cart
    var stickyCartht = $(".stickyCart").height(),
        mobileBar = $(".mbtlwraper").height();
    if($(window).scrollTop()>600 && $(".stickyCart").length){
        if(mobileBar != ''){
          $("body.template-product").css('padding-bottom',stickyCartht+mobileBar);
          $(".stickyCart").slideDown();
          $(".stickyCart").css('bottom',mobileBar);
        } else {
          $("body.template-product").css('padding-bottom',stickyCartht);
          $(".stickyCart").slideDown();
        }
    } else {
      	$("body.template-product").css('padding-bottom','0');
        $(".stickyCart").slideUp();
    }

    // SITE SCROLLER
    if($(window).scrollTop()>200){
      $("#site-scroll").fadeIn();
    } else {
      $("#site-scroll").fadeOut();
    }
  }
  
  $("#site-scroll").click(function(){
    $("html, body").animate({ scrollTop: 0 }, 1000);
    return false;
  }); 
  
   //Footer links for mobiles
  $(".footer-links .h4").click(function(){
    if($(window).width() < 750){
      $(this).toggleClass("active");
      $(this).next().slideToggle();
  	}
  });
  
  $(document).on('click', '.gridSwatches li:not(.noImg)', function(e){
      var $this = $(this),
          newImage = $(this).attr('rel'),
          gridWrapper = $(this).parents('.grid-view-item').find('.gimg-link');
      $(gridWrapper).find('.variantImg').css("background-image", "url('"+newImage+"')");
      var image = document.createElement('img');
          image.src = newImage;
          image.onload = function () {
              $(gridWrapper).addClass("showVariantImg");
              $this.siblings().removeClass("active");
              $this.addClass("active");
          };
      return false;
    });
    $(document).on('click', '.gridSwatches li.numb', function(e){
      $(this).parents('.gridSwatches').find('.hide').removeClass('hide');
      $(this).addClass('hide');
    });

    // Magnific Popup
    $('.mfp-link').magnificPopup({
      delegate: '.mfp',
  	  removalDelay: 300, 
      callbacks: {
        beforeOpen: function(){
          $('.stickyHeader').addClass('popup');
           this.st.mainClass = this.st.el.attr('data-effect');
        },       
      	close:function(){ $('.stickyHeader').removeClass('popup'); }
      },
  	 midClick: true 
	});
});

function htmlDecode(input){
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}
document.querySelectorAll('.mtmltxt').forEach(function(item){
    item.innerHTML = htmlDecode(item.innerHTML);
});





class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange(event) {
    this.updateOptions();
    this.updateMasterId();
    this.updateSelectedSwatchValue(event);
    this.toggleAddButton(true, '', false);
    this.removeErrorMessage();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', false);
      this.setUnavailable();
    } else {
      this.toggleAddButton(false, '', false);
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select, fieldset'), (element) => {
      if (element.tagName === 'SELECT') {
        return element.value;
      }
      if (element.tagName === 'FIELDSET') {
        return Array.from(element.querySelectorAll('input')).find((radio) => radio.checked)?.value;
      }
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
          return this.options[index] === option;
      }).includes(false);
    });
  }
  
  updateSelectedSwatchValue({ target }) {
    const { name, value, tagName } = target;
    if (tagName === 'SELECT' && target.selectedOptions.length) {
      const selectedSwatchValue = this.querySelector(`[data-opt="${name}"]`);
      if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    } else if (tagName === 'INPUT' && target.type === 'radio') {
      const selectedSwatchValue = this.querySelector(`[data-opt="${name}"]`);
      if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    }
  }

  updateMedia(){
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`),
          crmedia = $('.primgSlider .is-selected').data('id');
    if(crmedia != `media${this.currentVariant.featured_media.id}` || Shopify.designMode){
        mediaGalleries.forEach((mediaGallery) =>
          mediaGallery.setActiveMedia(`media${this.currentVariant.featured_media.id}`, true)
        );
    }
    
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updateVariantStatuses(){
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants.filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected).map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }


  setInputAvailability(elementList, availableValuesList) {
    elementList.forEach((element) => {
      const value = element.getAttribute('value');
      const availableElement = availableValuesList.includes(value);

      if (element.tagName === 'INPUT') {
        element.classList.toggle('disabled', !availableElement);
      } else if (element.tagName === 'OPTION') {
        element.classList.toggle('disabled', !availableElement);
      }
    });
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

    if($('.stickyCart').length){
        $('.selectedOpt').html(this.currentVariant.title);
        if(this.currentVariant.featured_image != null){
            $('.stickCtImg').attr('src',this.currentVariant.featured_image.src+'&width=50');
        }
    }
    
    fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (this.currentVariant.id !== requestedVariantId) return;

        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const destination = document.getElementById(`price-${this.dataset.section}`);
        const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
        const stockLabel = html.getElementById(`stockLabel-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const stockLabelDestination = document.getElementById(`stockLabel-${this.dataset.section}`);
        const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
        const pricePerItemDestination = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
        const pricePerItemSource = html.getElementById(`Price-Per-Item-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const volumePricingSource = html.getElementById(`Volume-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const volumePricingDestination = document.getElementById(`Volume-${this.dataset.section}`);
        const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);
        const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`);

        if (volumeNote) volumeNote.classList.remove('hidden');
        if (volumePricingDestination) volumePricingDestination.classList.remove('hidden');
        if (qtyRules) qtyRules.classList.remove('hidden');

        if (source && destination) destination.innerHTML = source.innerHTML;
        if (stockLabel && stockLabelDestination) stockLabelDestination.innerHTML = stockLabel.innerHTML;
        if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
        if (skuSource && skuDestination){
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle('hidden', skuSource.classList.contains('hidden'));
        }

        if (volumePricingSource && volumePricingDestination) {
          volumePricingDestination.innerHTML = volumePricingSource.innerHTML;
        }

        if (pricePerItemSource && pricePerItemDestination) {
          pricePerItemDestination.innerHTML = pricePerItemSource.innerHTML;
          pricePerItemDestination.classList.toggle('hidden', pricePerItemSource.classList.contains('hidden'));
        }

        const price = document.getElementById(`price-${this.dataset.section}`);

        if(price) price.classList.remove('hidden');
        
        
        const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`);
        this.toggleAddButton(addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true, window.variantStrings.soldOut);
        
        publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId,
            html,
            variant: this.currentVariant,
          },
        });
      });
  }

  toggleAddButton(disable = false, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if(disable){
      addButton.setAttribute('disabled', 'disabled');
      if(text) addButtonText.textContent = text;
      if($('.backStock').length) checkBackinstock(`${this.currentVariant.id}`);

    } else {
      addButton.removeAttribute('disabled');
      var qty = $(`#pvr-${this.currentVariant.id}`).text();
      if(qty < 1 && this.currentVariant.inventory_management == "shopify" && this.currentVariant.available){
        addButtonText.textContent = window.variantStrings.preOrder;
      } else{
        addButtonText.textContent = window.variantStrings.addToCart;
      }
      if($('.backStock').length)$('.backStock').addClass('hide');
    }
    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
    const sku = document.getElementById(`Sku-${this.dataset.section}`);
    const pricePerItem = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
    const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`);
    const volumeTable = document.getElementById(`Volume-${this.dataset.section}`);
    const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('hidden');
    if (inventory) inventory.classList.add('hidden');
    if (sku) sku.classList.add('hidden');
    if (pricePerItem) pricePerItem.classList.add('hidden');
    if (volumeNote) volumeNote.classList.add('hidden');
    if (volumeTable) volumeTable.classList.add('hidden');
    if (qtyRules) qtyRules.classList.add('hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}
customElements.define('variant-selects', VariantSelects);



if (!customElements.get('product-info')) {
  customElements.define('product-info', class ProductInfo extends HTMLElement {
      constructor() {
        super();
        this.input = this.querySelector('.quantity__input');
        this.currentVariant = this.querySelector('.product-variant-id');
        this.submitButton = this.querySelector('[type="submit"]');
      }

      cartUpdateUnsubscriber = undefined;
      variantChangeUnsubscriber = undefined;

      connectedCallback() {
        if (!this.input) return;
        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;
        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

          if (event.data.sectionId !== sectionId) return;
          this.updateQuantityRules(event.data.sectionId, event.data.html);
          this.setQuantityBoundries();
        });
      }

      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }
        if (this.variantChangeUnsubscriber) {
          this.variantChangeUnsubscriber();
        }
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.input.dataset.cartQuantity ? parseInt(this.input.dataset.cartQuantity) : 0,
          min: this.input.dataset.min ? parseInt(this.input.dataset.min) : 1,
          max: this.input.dataset.max ? parseInt(this.input.dataset.max) : null,
          step: this.input.step ? parseInt(this.input.step) : 1,
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.input.min = min;
        this.input.max = max;
        this.input.value = min;
        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        if (!this.currentVariant || !this.currentVariant.value) return;
        this.querySelector('.quantity__rules-cart .loading__spinner').classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${this.currentVariant.value}&section_id=${this.dataset.section}`)
          .then((response) => {
            return response.text();
          })
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            this.updateQuantityRules(this.dataset.section, html);
            this.setQuantityBoundries();
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.querySelector('.quantity__rules-cart .loading__spinner').classList.add('hidden');
          });
      }

      updateQuantityRules(sectionId, html) {
        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === '.quantity__input') {
            const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) current.setAttribute(attribute, valueUpdated);
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }
    }
  );
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('.qtyBtn').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }
  quantityUpdateUnsubscriber = undefined;
  connectedCallback(){
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }
  disconnectedCallback(){
    if(this.quantityUpdateUnsubscriber){ this.quantityUpdateUnsubscriber(); }
  }
  onInputChange(event){ this.validateQtyRules(); }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if(previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if(this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".qtyBtn[name='minus']");
      buttonMinus.classList.toggle('disabled', value <= min);
    }
    if(this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".qtyBtn[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}
customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay){
  let lastCall = 0;
  return function (...args){
    const now = new Date().getTime();
    if(now - lastCall < delay){
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = 'json'){
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
  };
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);
  if(elementToFocus) elementToFocus.focus();
}

var trapFocusHandlers = {};
function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (e) => {
    if( e.target !== container && e.target !== last && e.target !== first )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function(){
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(e) {
    if(e.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if(e.target === last && !e.shiftKey) {
      e.preventDefault();
      first.focus();
    }
    //  On the first focusable element and tab backward, focus the last element.
    if((e.target === container || e.target === first) && e.shiftKey){
      e.preventDefault();
      last.focus();
    }
  };
  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);
  elementToFocus.focus();
  if(elementToFocus.tagName === 'INPUT' && ['search', 'text', 'email', 'url'].includes(elementToFocus.type) && elementToFocus.value){
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (e) => {
      e.preventDefault();
      var cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}
customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);
    this.addEventListener('change', debouncedOnChange.bind(this));
  }
  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if(event.source === 'cart-items') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if(this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  onChange(e){
    var stopTg = e.target.classList.contains('stopEv');
    if(!stopTg){
      this.updateQuantity(e.target.dataset.index, e.target.value, document.activeElement.getAttribute('name'), e.target.dataset.quantityVariantId);
    }
  }   
  onCartUpdate(){
    if(this.tagName === 'CART-DRAWER-ITEMS'){
      fetch(`${routes.cart_url}?section_id=cart-drawer`).then((response) => response.text()).then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if(targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        }).catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`).then((response) => response.text()).then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        }).catch((e) => {
          console.error(e);
        });
    }
  }
    
  getSectionsToRender(){
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.cartTotal',
      }
    ];
  }

  updateQuantity(line, quantity, name, variantId){
      this.enableLoading(line);
    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } }).then((response) => {
        return response.text();
      }).then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart-item');

        if(parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');

        if(cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if(cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
        });
        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        let message = '';
        if(items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
          if(typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }
        this.updateLiveRegions(line, message);

        const lineItem =
          document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        if(lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if(parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
        } else if(document.querySelector('.cart-item') && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch(() => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if(lineItemError) lineItemError.querySelector('.ctItem-error').innerHTML = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);
    freeShippMsg();

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }
  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }
  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}
customElements.define('cart-items', CartItems);

if(!customElements.get('cart-note')) {
  customElements.define('cart-note', class CartNote extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('change', debounce((e) => {
        var body = JSON.stringify({ note: e.target.value });
        fetch(`${routes.cart_update_url}`, {...fetchConfig(), ...{ body }});
      }, 300))
    }
  });
};

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    var cartLink = document.querySelector('#cartLink');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.open(cartLink)
    });
    cartLink.addEventListener('keydown', (e) => {
      if(e.code.toUpperCase() === 'SPACE') {
        e.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if(triggeredBy) this.setActiveElement(triggeredBy);
    var cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if(cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    // setTimeout(() => {this.classList.add('active')});
    handleFloCartBtn()

    this.addEventListener('transitionend', () => {
      var containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.drawer__inner-empty') : document.getElementById('CartDrawer');
      var focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });

    document.body.classList.add('overflow-hidden');
    document.body.classList.remove('loading');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if(cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (e) => {
      e.currentTarget.setAttribute('aria-expanded', !e.currentTarget.closest('details').hasAttribute('open'));
    });

    //cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      var sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      sectionElement.innerHTML =
          this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    }));

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }
  getSectionInnerHTML(html, selector = '.shopify-section'){
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }
  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer'
      }
    ];
  }
  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }
  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner'
      }
    ];
  }
}
customElements.define('cart-drawer-items', CartDrawerItems);

class CouponCode extends HTMLElement {
  constructor() {
    super();
    if(localStorage.getItem('storedDiscount')){
      this.querySelector('input[name="discount"]').value = localStorage.getItem('storedDiscount');  
    }
    this.querySelector('[data-update-coupon]').addEventListener('click', (event) => {
      this.val = this.querySelector('input[name="discount"]').value;
      localStorage.setItem('storedDiscount', this.val);
      fetch(`/discount/${this.val}`).then((response) => response.text()).then((responseText) =>{

      });
      if(document.querySelector('#cartCoupon')){
        document.querySelector('#cartCoupon').classList.remove("active");
      }
    })
  }
}
customElements.define('coupon-code', CouponCode);

class CartOption extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('.cftBtn').forEach((button) => button.addEventListener("click", function(e){
        e.preventDefault()
        var ftbk = this.hash.substr(1);
        $('.cftDraw.active').removeClass('active');
        document.getElementById(ftbk).classList.add("active");
    }));
    document.querySelectorAll('.saveBtn').forEach((button) => button.addEventListener("click", function(e){
        var box = document.querySelectorAll('.cftDraw');
        box.forEach(box => { box.classList.remove("active"); });
    }));
  }
}
customElements.define('cart-option', CartOption);

function startTimer(duration, display){
    var timer = duration, minutes, seconds;
    setInterval(function(){
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        display.textContent = minutes + ":" + seconds;

        if(--timer < 0){
            clearInterval(startTimer);
            document.querySelector('.cartCountdown').remove();
        }
    }, 1000);
}
window.onload = function(){
    if(document.querySelector('.cartCountdown')){
        var minutes = document.querySelector('.cartCountdown').getAttribute('data-countdown'),
            display = document.querySelector('#cartTime');
        startTimer(minutes, display);
    }
};

if(!customElements.get('product-form')){
  customElements.define('product-form',class ProductForm extends HTMLElement{
      constructor() {
        super();
        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');

        if(document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt){
        evt.preventDefault();
        if(this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.btn_spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if(this.cart) {
          formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config).then((response) => response.json()).then((response) => {
            if(response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if(!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if(!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if(!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if(quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if(this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if(!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.btn_spinner').classList.add('hidden');
            freeShippMsg();
          });
      }

      handleErrorMessage(errorMessage = false) {
        if(this.hideErrors) return;

        this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if(!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');
        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
        if(errorMessage){ this.errorMessage.textContent = errorMessage; }
      }
    }
  );
}
function freeShippMsg(){
    console.log('free Shipp');
    fetch(window.routes.url+'/?section_id=cart-template').then((response) => response.text()).then((responseText) => {
        var html = new DOMParser().parseFromString(responseText, 'text/html')
        var destination = document.querySelector('#CartCount');
        var source = html.querySelector('#cartItems');
        if(source && destination) destination.innerHTML = source.innerHTML;

        if(document.querySelector('.freeShipMsg')){
            var freeship = document.querySelector('.freeShipMsg');
            var shipsource = html.querySelector('.freeShipget');
            if(shipsource && freeship) freeship.innerHTML = shipsource.innerHTML;
            if(theme.mlcurrency){ currenciesChange(".freeShipMsg span.money"); }
        }
    });
}
freeShippMsg();
function shopreviews(){
    
}