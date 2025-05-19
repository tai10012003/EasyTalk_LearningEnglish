(function ($) {
  "use strict";

  var review = $('.player_info_item');
  if (review.length) {
    review.owlCarousel({
      items: 1,
      loop: true,
      dots: false,
      autoplay: true,
      margin: 40,
      autoplayHoverPause: true,
      autoplayTimeout: 5000,
      nav: true,
      navText: [
        '<img src="img/icon/left.svg" alt="">',
        '<img src="img/icon/right.svg" alt="">'

      ],
      responsive: {
        0: {
          margin: 15,
        },
        600: {
          margin: 10,
        },
        1000: {
          margin: 10,
        }
      }
    });
  }
  $('.popup-youtube, .popup-vimeo').magnificPopup({
    // disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,
    fixedContentPos: false
  });



  var review = $('.textimonial_iner');
  if (review.length) {
    review.owlCarousel({
      items: 1,
      loop: true,
      dots: true,
      autoplay: true,
      autoplayHoverPause: true,
      autoplayTimeout: 5000,
      nav: false,
      responsive: {
        0: {
          margin: 15,
        },
        600: {
          margin: 10,
        },
        1000: {
          margin: 10,
        }
      }
    });
  }

$('.counter').counterUp({
  time: 2000
});

  $('.slider').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    speed: 300,
    infinite: true,
    asNavFor: '.slider-nav-thumbnails',
    autoplay:true,
    pauseOnFocus: true,
    dots: true,
  });
 
  $('.slider-nav-thumbnails').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    asNavFor: '.slider',
    focusOnSelect: true,
    infinite: true,
    prevArrow: false,
    nextArrow: false,
    centerMode: true,
    responsive: [
      {
        breakpoint: 480,
        settings: {
          centerMode: false,
        }
      }
    ]
  });
 
  //remove active class from all thumbnail slides
  $('.slider-nav-thumbnails .slick-slide').removeClass('slick-active');
 
  //set active class to first thumbnail slides
  $('.slider-nav-thumbnails .slick-slide').eq(0).addClass('slick-active');
 
  // On before slide change match active thumbnail to current slide
  $('.slider').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
    var mySlideNumber = nextSlide;
    $('.slider-nav-thumbnails .slick-slide').removeClass('slick-active');
    $('.slider-nav-thumbnails .slick-slide').eq(mySlideNumber).addClass('slick-active');
 });
 
 //UPDATED 
   
 $('.slider').on('afterChange', function(event, slick, currentSlide){   
   $('.content').hide();
   $('.content[data-id=' + (currentSlide + 1) + ']').show();
 }); 

 $('.gallery_img').magnificPopup({
  type: 'image',
  gallery:{
    enabled:true
  }
});

$(document).ready(function() {
    const navbar = $('.main_menu');
    let lastScroll = 0;
    const scrollThreshold = 200;

    // Mặc định không có animation
    navbar.addClass('menu_fixed');
    navbar.removeClass('menu_animated');

    $(window).scroll(function() {
        let currentScroll = $(this).scrollTop();

        if (currentScroll >= scrollThreshold) {
            // Thêm animation khi scroll xuống quá 200px
            navbar.addClass('menu_animated slideInDown');
        } else {
            // Xóa animation khi scroll chưa tới 200px
            navbar.removeClass('menu_animated slideInDown'); 
        }

        lastScroll = currentScroll;
    });

    // Enhanced dropdown effects
    $('.dropdown').each(function() {
        const $dropdown = $(this);
        const $menu = $dropdown.find('.dropdown-menu');
        
        $dropdown.hover(
            function() {
                $menu.stop(true, true).fadeIn(200);
                $(this).addClass('show');
                $menu.addClass('show animated fadeInUp');
            },
            function() {
                $menu.stop(true, true).fadeOut(200);
                $(this).removeClass('show');
                $menu.removeClass('show animated fadeInUp');
            }
        );
    });

    // Mobile menu handling
    $('.navbar-toggler').on('click', function() {
        $('.mobile-sidebar').addClass('active');
        $('.mobile-overlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    $('.sidebar-close, .mobile-overlay').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').css('overflow', '');
    });

    // Handle dropdown in sidebar
    $('.sidebar-nav .dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        $(this).next('.dropdown-menu').slideToggle(300);
        $(this).toggleClass('show');
    });

    // Enhanced dropdown animation
    $('.dropdown').hover(
        function() {
            const $menu = $(this).find('.dropdown-menu');
            $menu.stop().fadeIn(200).addClass('show');
            $(this).addClass('show');
        },
        function() {
            const $menu = $(this).find('.dropdown-menu');
            $menu.stop().fadeOut(200).removeClass('show');
            $(this).removeClass('show');
        }
    );

    // Enhanced dropdown hover effects
    $('.dropdown').hover(
        function() {
            const $menu = $(this).find('.dropdown-menu');
            $menu.stop(true, true).fadeIn(200);
            $(this).addClass('show');
            $menu.addClass('show animated fadeInDown');
        },
        function() {
            const $menu = $(this).find('.dropdown-menu');
            $menu.stop(true, true).fadeOut(200); 
            $(this).removeClass('show');
            $menu.removeClass('show animated fadeInDown');
        }
    );

    // Mobile menu sidebar toggle
    $('.navbar-toggler').on('click', function() {
        $('.mobile-sidebar').addClass('active');
        $('.mobile-overlay').addClass('active');
        $('body').addClass('no-scroll');
    });

    // Close mobile sidebar
    $('.mobile-overlay, .sidebar-close').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').removeClass('no-scroll');
    });

    // Toggle submenu in mobile sidebar
    $('.mobile-sidebar .dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        $(this).next('.dropdown-menu').slideToggle(300);
        $(this).toggleClass('show');
    });

    // Mobile menu toggle
    $('.navbar-toggler').on('click', function() {
        $('.mobile-sidebar').addClass('active');
        $('.mobile-overlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    $('.sidebar-close, .mobile-overlay').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').css('overflow', '');
    });

    // Mobile dropdown toggle
    $('.sidebar-nav .dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        const $dropdown = $(this).parent('.dropdown');
        const $menu = $dropdown.find('.dropdown-menu');
        
        if($dropdown.hasClass('show')) {
            $dropdown.removeClass('show');
        } else {
            $('.sidebar-nav .dropdown').removeClass('show');
            $dropdown.addClass('show');
        }
    });

    // Close mobile menu when clicking menu items
    $('.mobile-sidebar .nav-link:not(.dropdown-toggle)').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').css('overflow', '');
    });

    // Mobile menu toggle
    $('.navbar-toggler').on('click', function() {
        $('.mobile-sidebar').addClass('active');
        $('.mobile-overlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    // Close mobile sidebar
    $('.sidebar-close, .mobile-overlay').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').css('overflow', '');
    });

    // Toggle submenu in sidebar
    $('.sidebar-nav .dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const $dropdownMenu = $(this).next('.dropdown-menu');
        const $dropdown = $(this).parent('.dropdown');
        
        if($dropdown.hasClass('show')) {
            $dropdownMenu.slideUp(300);
            $dropdown.removeClass('show');
        } else {
            $('.sidebar-nav .dropdown-menu').slideUp(300);
            $('.sidebar-nav .dropdown').removeClass('show');
            $dropdownMenu.slideDown(300);
            $dropdown.addClass('show');
        }
    });

    // Close sidebar when clicking menu items
    $('.mobile-sidebar .nav-link:not(.dropdown-toggle)').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').css('overflow', '');
    });

    // Desktop dropdown hover
    $('.navbar .dropdown').hover(
        function() {
            $(this).find('.dropdown-menu').stop(true, true).fadeIn(200);
            $(this).addClass('show');
        },
        function() {
            $(this).find('.dropdown-menu').stop(true, true).fadeOut(200);
            $(this).removeClass('show');
        }
    );

    // Desktop dropdown hover
    $('.navbar .dropdown').hover(
        function() {
            $(this).find('.dropdown-menu').stop(true, true).fadeIn(200);
        },
        function() {
            $(this).find('.dropdown-menu').stop(true, true).fadeOut(200);
        }
    );

    // Mobile sidebar toggle
    $('.navbar-toggler').on('click', function() {
        $('.mobile-sidebar').addClass('active');
        $('.mobile-overlay').addClass('active');
        $('body').addClass('no-scroll');
    });

    // Close mobile sidebar
    $('.mobile-overlay, .sidebar-close').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').removeClass('no-scroll');
    });

    // Mobile dropdown toggle
    $('.mobile-sidebar .dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $dropdown = $(this).parent('.dropdown');
        const $menu = $dropdown.find('.dropdown-menu');
        
        // Close other open dropdowns
        if (!$dropdown.hasClass('show')) {
            $('.mobile-sidebar .dropdown.show .dropdown-menu').slideUp(300);
            $('.mobile-sidebar .dropdown.show').removeClass('show');
        }
        
        // Toggle current dropdown
        $menu.slideToggle(300);
        $dropdown.toggleClass('show');
    });

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.dropdown').length) {
            $('.dropdown-menu').fadeOut(200);
        }
    });

    // Clear duplicate event handlers
    $('.navbar-toggler').off('click');
    $('.navbar .dropdown').off('mouseenter mouseleave');
    
    // Single mobile sidebar handler
    $('.navbar-toggler').on('click', function() {
        $('.mobile-sidebar').addClass('active'); 
        $('.mobile-overlay').addClass('active');
        $('body').addClass('no-scroll');
    });

    // Close mobile sidebar
    $('.mobile-overlay, .sidebar-close').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').removeClass('no-scroll'); 
    });

    // Enhanced desktop dropdown with animation
    $('.navbar .dropdown').hover(
        function() {
            const $menu = $(this).find('.dropdown-menu');
            $(this).addClass('show');
            $menu.addClass('show animated fadeInDown');
            $menu.css({
                'display': 'block',
                'opacity': '0',
                'transform': 'translateY(10px)'
            }).animate({
                'opacity': '1',
                'transform': 'translateY(0)'
            }, 300);
        },
        function() {
            const $menu = $(this).find('.dropdown-menu');
            $(this).removeClass('show');
            $menu.animate({
                'opacity': '0',
                'transform': 'translateY(10px)'
            }, 300, function() {
                $menu.removeClass('show animated fadeInDown').hide();
            });
        }
    );

    // Mobile dropdown toggle
    $('.mobile-sidebar .dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $dropdown = $(this).parent('.dropdown');
        const $menu = $dropdown.find('.dropdown-menu');
        
        if($dropdown.hasClass('show')) {
            $menu.slideUp(300);
            $dropdown.removeClass('show');
        } else {
            // Close other dropdowns
            $('.mobile-sidebar .dropdown.show .dropdown-menu').slideUp(300);
            $('.mobile-sidebar .dropdown.show').removeClass('show');
            
            // Open clicked dropdown
            $menu.slideDown(300);
            $dropdown.addClass('show');
        }
    });

    // Mobile Menu Functionality
    // Toggle mobile sidebar
    $('.navbar-toggler').on('click', function() {
        $('.mobile-sidebar').addClass('active');
        $('.mobile-overlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    // Close mobile sidebar
    $('.sidebar-close, .mobile-overlay').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active'); 
        $('body').css('overflow', '');
    });

    // Toggle submenu in mobile sidebar
    $('.sidebar-nav .dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const $dropdown = $(this).parent('.dropdown');
        
        if($dropdown.hasClass('show')) {
            $dropdown.removeClass('show').find('.dropdown-menu').slideUp(300);
        } else {
            // Close other open dropdowns
            $('.sidebar-nav .dropdown.show').removeClass('show').find('.dropdown-menu').slideUp(300);
            // Open clicked dropdown
            $dropdown.addClass('show').find('.dropdown-menu').slideDown(300);
        }
    });

    // Close sidebar when clicking menu items
    $('.mobile-sidebar .nav-link:not(.dropdown-toggle)').on('click', function() {
        $('.mobile-sidebar').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').css('overflow', '');
    });

    // Mobile Menu Handler
    // Toggle mobile menu
    $('.navbar-toggler').on('click', function() {
        $('.navbar-collapse').toggleClass('show');
        $('body').toggleClass('no-scroll');
    });

    // Handle dropdowns on mobile
    $('.dropdown-toggle').on('click', function(e) {
        if (window.innerWidth < 992) {
            e.preventDefault();
            $(this).parent().toggleClass('show');
            $(this).next('.dropdown-menu').slideToggle(200);
        }
    });

    // Close menu when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.navbar').length) {
            $('.navbar-collapse').removeClass('show');
            $('body').removeClass('no-scroll');
        }
    });

    // Xóa các event handler cũ
    $('.navbar-toggler').off('click');
    $('.navbar .dropdown').off('mouseenter mouseleave');

    // Desktop dropdown hover
    if(window.innerWidth >= 992) {
        $('.dropdown').hover(
            function() {
                $(this).find('.dropdown-menu').stop(true, true).delay(100).fadeIn(200);
            },
            function() {
                var $dropdownMenu = $(this).find('.dropdown-menu');
                var $this = $(this);
                
                setTimeout(function() {
                    if (!$dropdownMenu.is(':hover')) {
                        $dropdownMenu.stop(true, true).fadeOut(200);
                    }
                }, 200);
            }
        );

        $('.dropdown-menu').hover(
            function() {
                $(this).stop(true, true).show();
            },
            function() {
                $(this).stop(true, true).fadeOut(200);
            }
        );
    }
});

document.addEventListener('DOMContentLoaded', function () {
  var currentPath = window.location.pathname; // Lấy đường dẫn hiện tại
  var navLinks = document.querySelectorAll('.main-menu-item .nav-link'); // Chọn tất cả các liên kết trong menu

  navLinks.forEach(function (link) {
      // Kiểm tra xem URL của liên kết có khớp với đường dẫn hiện tại không
      if (link.getAttribute('href') === currentPath) {
          link.classList.add('active'); // Thêm lớp active cho liên kết khớp
      }
  });
});

}(jQuery));