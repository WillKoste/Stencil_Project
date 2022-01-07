import utils, {hooks} from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import {createTranslationDictionary} from '../theme/common/utils/translations-utils';
import swal from './global/sweet-alert';
import Cart from './cart';
import axios from 'axios';

export default class Category extends CatalogPage {
	constructor(context) {
		super(context);
		this.validationDictionary = createTranslationDictionary(context);
		this.categoryCart = new Cart(context);
	}

	setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
		$element.attr({
			role: roleType,
			'aria-live': ariaLiveStatus
		});
	}

	makeShopByPriceFilterAccessible() {
		if (!$('[data-shop-by-price]').length) return;

		if ($('.navList-action').hasClass('is-active')) {
			$('a.navList-action.is-active').focus();
		}

		$('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
	}

	onReady() {
		this.arrangeFocusOnSortBy();
		this.bindEvents();

		$('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

		this.makeShopByPriceFilterAccessible();

		compareProducts(this.context);

		if ($('#facetedSearch').length > 0) {
			this.initFacetedSearch();
		} else {
			this.onSortBySubmit = this.onSortBySubmit.bind(this);
			hooks.on('sortBy-submitted', this.onSortBySubmit);
		}

		$('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

		this.ariaNotifyNoProducts();
	}

	ariaNotifyNoProducts() {
		const $noProductsMessage = $('[data-no-products-notification]');
		if ($noProductsMessage.length) {
			$noProductsMessage.focus();
		}
	}

	initFacetedSearch() {
		const {price_min_evaluation: onMinPriceError, price_max_evaluation: onMaxPriceError, price_min_not_entered: minPriceNotEntered, price_max_not_entered: maxPriceNotEntered, price_invalid_value: onInvalidPrice} = this.validationDictionary;
		const $productListingContainer = $('#product-listing-container');
		const $facetedSearchContainer = $('#faceted-search-container');
		const productsPerPage = this.context.categoryProductsPerPage;
		const requestOptions = {
			config: {
				category: {
					shop_by_price: true,
					products: {
						limit: productsPerPage
					}
				}
			},
			template: {
				productListing: 'category/product-listing',
				sidebar: 'category/sidebar'
			},
			showMore: 'category/show-more'
		};

		this.facetedSearch = new FacetedSearch(
			requestOptions,
			(content) => {
				$productListingContainer.html(content.productListing);
				$facetedSearchContainer.html(content.sidebar);

				$('body').triggerHandler('compareReset');

				$('html, body').animate(
					{
						scrollTop: 0
					},
					100
				);
			},
			{
				validationErrorMessages: {
					onMinPriceError,
					onMaxPriceError,
					minPriceNotEntered,
					maxPriceNotEntered,
					onInvalidPrice
				}
			}
		);
	}
	bindCategoryEvents() {
		$('.cart-remove-all').on('click', (e) => {
			utils.api.cart.getCart({}, (err, resp) => {
				if (err) {
					console.log({err});
					return;
				}
				console.log({resp});
				swal
					.fire({
						text: 'Are you sure you would like to clear your cart?',
						icon: 'warning',
						showCancelButton: true,
						cancelButtonText: 'Cancel'
					})
					.then((rez) => {
						if (rez.value) {
							this.categoryCart.deleteCart(resp.id);
						}
					});
			});
		});

		$('#add-all-to-cart-btn').on('click', (e) => {
			console.log({e});
			if (!this.context.cartId) {
			}
			this.categoryCart.addLineItem();
			// const config = {
			// 	headers: {
			// 		'X-Auth-Token': 'nqe2ml79cq6kx2vb3lf6gs4wlt73ht3',
			// 		'Content-Type': 'application/json',
			// 		'X-Request-Id': 'b2adfc3953ed54efd1cf0e24731b58d7',
			// 		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
			// 		// 'Access-Control-Allow-Origin': 'https://api.bigcommerce.com'
			// 	}
			// };

			// const options = {
			// 	method: 'GET',
			// 	url: 'https://api.bigcommerce.com/stores/iw6ip4a3u4/v3/catalog/products',
			// 	qs: {'categories:in': '24'},
			// 	headers: {'x-auth-token': 'nqe2ml79cq6kx2vb3lf6gs4wlt73ht3'}
			// };

			// request(options, function (error, response, body) {
			// 	if (error) throw new Error(error);

			// 	console.log({body});
			// });

			// axios
			// 	.get('https://api.bigcommerce.com/stores/iw6ip4a3u4/v3/catalog/products?categories:in=24', config)
			// 	.then((r) => console.log({LOOK_WILL: r.data}))
			// 	.catch((err) => console.log({err}));
			// console.log({LOOK_WILL: thing.data});
		});
	}
	bindEvents() {
		this.bindCategoryEvents();
	}
}
