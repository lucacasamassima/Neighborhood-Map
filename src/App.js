import React, { Component } from 'react';

import PropTypes from 'prop-types';
import escapeRegExp from 'escape-string-regexp';
import sortBy from 'sort-by';

// Material design components
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';

// Material design icons
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';

// Personal components
import Search from './components/Search';
import Map from './components/Map';

// Design settings
import './App.css';

// Import universities data
import * as Places from './data/Places.json';

class App extends Component {
	state = {
		// Map data & setting
		places: [],
		markers: [],
		nearPlaces: [],
		center: {
			lat: 41.1171432,
			lng: 16.871871499999997
		},
		zoom: 8,

		// Search menu
		open: false,

		// Search & filtering
		query: '',
		results: [],

		// Markers' parameter
		activeMarker: {},
		selectedPlace: {},
		showingInfoWindow: false,
	};

	// Foursquare API
	getFoursquareData = (markers, places) => {
		const api = 'https://api.foursquare.com/v2';
		
		const client = {
			id: 'XQOR1EMOAZE3AEJX4NYPAMC0WH22SOHTREX0HUSILQHKPKN1',
			secret: '2VPJRQ3BR3QZR0PHMUMP321O5CB0ZG3YDXYRVQDB3EHJTFNI',
			v: '20180323'
		};

		fetch(`${api}/venues/search?ll=${places.pos.lat},${places.pos.lng}&name={places.name}&categoryId=4d4b7105d754a06372d81259,4bf58dd8d48988d198941735,4bf58dd8d48988d197941735&limit=5&radius=1500&client_id=${client.id}&client_secret=${client.secret}&v=${client.v}`, {
			method: 'GET',
		}).then(res => {
			if(res.ok) {
				return res.json();
			} else {
				throw new Error("Sorry, can't get information from Foursquare...");			
			}
		}).then(data => {
			const p = data.response.venues;
			const nearPlaces = [];

			p.forEach((place) => {
				if(!place.name.includes(markers.name)) {
					nearPlaces.push(place.name);
				}
			});

			this.setState({nearPlaces});
		}).catch((error) => {
			alert(error);
		});	
	};

	// Load and order the places
	loadPlaces = () => {
		let places = Places.sort(sortBy('name'));
		let results = places;
		this.setState({places, results});
	};

	componentDidMount() {
		this.loadPlaces();
	};

	// Open or close the search menu
	toggleMenu = () => {
		if(this.state.open === false) {
			this.setState({open: true});
		} else {
			this.setState({open: false});
		}
	};

	// Store all marker inside an array
	onMarkerCreated = (marker) => {
		let { markers } = this.state;

		if (marker !== null) {
			markers.push(marker);
		}
	}

	// When results are filtered, zoom and center on them
	zoomAndCenter = () => {
		const { results } = this.state;
		
		let bound = new window.google.maps.LatLngBounds();
		let center, zoom;
		
		if(results.length === 0 || results.length === this.state.places.length) {
			center = { lat: 41.1171432, lng: 16.871871499999997 };
			zoom = 8;
		} else if(results.length === 1) {
			center = results[0].pos;
			zoom = 17;
		} else {
			for(let i = 0; i < results.length; i++) {
				let place = new window.google.maps.LatLng(results[i].pos);
				bound.extend(place);
			}
			let centerLat = (bound.f.b + bound.f.f)/2;
			let centerLng = (bound.b.b + bound.b.f)/2;
			center = {lat: centerLat, lng: centerLng};
			zoom = 8;
		}
		this.setState({zoom, center});
	};

	// Search function
	searchPlaces = (query) => {
		const { places } = this.state;
		let results;

		if(query) {
			const match = new RegExp(escapeRegExp(query), 'i');
			results = places.filter((univ) => (match.test(univ.name)));
		} else {
			results = places;
		}

		results.sort(sortBy('name'));
		this.setState({results, query}, this.zoomAndCenter);
	};

	// Handling click on searchbar's results
	clickOnResult = (center, marker, place) => {
		for (const createdMarker of this.state.markers) {
			if (createdMarker.props.id === place.id) {
				new createdMarker.props.google.maps.event.trigger(createdMarker.marker, 'click');
			}
		}
		this.setState({zoom: 17, center, open: false});
	};

	// Handling click on markers
	clickOnMarker = (center, marker, place) => {
		this.getFoursquareData(marker, place);
		marker.id === place.id && marker.setAnimation(window.google.maps.Animation.BOUNCE);
		window.setTimeout(() => {
				marker.setAnimation(null);
		}, 2000);
		this.setState({zoom: 17, center, activeMarker: marker, selectedPlace: place, showingInfoWindow: true});
	};

	// Handling click on the map
	clickOnMap = () => {
		if (this.state.showingInfoWindow) {
			this.setState({activeMarker: null, selectedPlace: {}, showingInfoWindow: false});
		}
		this.setState({zoom: 8, center: { lat: 41.1171432, lng: 16.871871499999997 }, open: false});
	};

	// Handling infowindow's closing
	closeInfoWindow = () => {
		this.setState({zoom: 8, center: { lat: 41.1171432, lng: 16.871871499999997 }, activeMarker: null, selectedPlace: {}, showingInfoWindow: false});
	}

	render() {
		// states & props
		const { open, query, results } = this.state;

		// Styles' array for material elements
		const styles = {
			header: {
				width: '100%',
			},
			appbar: {
				backgroundColor: '#3f51b5',
			},
			searchBtn: {
				marginLeft: 12,
				marginRight: 20,
			},
			title: {
				fontFamily: 'Raleway, sans-serif',
				fontSize: '24px',
				textDecoration: 'underline',
			},
			footer: {
				backgroundColor: '#3f51b5',
				width: '100%',
			},
			credits: {
				margin: 'auto',
				fontFamily: 'Courgette, sans-serif',
				fontSize: '16px',
			}
		};

		return (
			<div className="app">
				{ /* start header */ }
				<AppBar style={styles.appbar} position="static">
					<Toolbar>
						<IconButton style={styles.searchBtn} className="search" color="inherit" aria-label="Toggle search menu" onClick={(event) => this.toggleMenu()}>
							{ open ? <CloseIcon /> : <SearchIcon /> }
						</IconButton>
						<Typography style={styles.title} variant="title" color="inherit">UniAPVLIA</Typography>
					</Toolbar>
				</AppBar>
				{ /* end header */ }

				{ /* start main app */ }
				<main className="app-container">
					<Slide direction="right" in={open} mountOnEnter unmountOnExit>
						<Search data={results} search={this.searchPlaces} query={query} click={this.clickOnResult} />
					</Slide>
					<Map data={results} zoom={this.state.zoom} center={this.state.center} onDezoom={this.getFar} onClickMarker={this.clickOnMarker} 
					onClickMap={this.clickOnMap} onVisible={this.state.showingInfoWindow} marker={this.state.activeMarker} nearPlaces={this.state.nearPlaces}
					selectedPlace={this.state.selectedPlace} onClose={this.closeInfoWindow} onMarkerCreated={this.onMarkerCreated} />
				</main>
				{ /* end main app */ }

				{ /* start footer */ }
				<AppBar position="static" style={styles.footer}>
					<Toolbar>
						<Typography style={styles.credits} color="inherit">Created by Michele De Palma - 2018 - Powered by ReactJS</Typography>
					</Toolbar>
				</AppBar>
				{ /* end footer */ }
			</div>
		);
	}

	static propTypes = {
		query: PropTypes.string,
	};
}

export default App;
