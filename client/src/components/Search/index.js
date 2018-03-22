import { h , Component, cloneElement } from 'preact';
import style from './style';
import axios from 'axios';
import {API_SERVER} from '../../../config';
import { route } from 'preact-router';
const OK_STATUS = 'OK';

export default class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      predictions: [],
      placeIDs: [],
      descSubfields: [],
      marker: null,
      position: {},
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSelectedPlace = this.handleSelectedPlace.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
    // process autocomplete request and update list
    axios.post(`${API_SERVER}/search/autocomplete`, {
      input: this.state.value,      
      lat: this.state.position.lat,
      lng: this.state.position.lng,
    }).then((response) => {
      const status = response.data.status;
      const predictions = response.data.predictions;
      const placeIds = response.data.placeIds;
      const descSubfields = response.data.descSubfields;

      this.setState({
        predictions,
        placeIds,
        descSubfields,
      });
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    axios.post(`${API_SERVER}/search/textsearch`, {
      input: this.state.value,
      lat: this.state.position.lat,
      lng: this.state.position.lng,
      }).then((response) => { 
        if(response.data.status == OK_STATUS)
        {
          const [searchResult] = response.data.results;
          this.handleSelectedPlace(searchResult);
        }          
        else
          alert(response.data.status);
      });
      
  }

  /**
   * On search input query completion, add a marker to the map at the search result.
   *
   * @param {*} placeDetail 
   */
  handleSelectedPlace(placeDetail) {
    if (this.props.routeUrl === '/maps') {
      this.props.addMarker(placeDetail.geometry.location, placeDetail.place_id);
      
      //TO DO: Customize the marker popup
      // this.state.marker.bindPopup(`<b>${placeDetail.name || ''} </b>${placeDetail.formatted_address}`)
    } else {
      this.props.updateSearchResult(placeDetail);
      route('/maps', true);
    }
  }

  render() {
    // pass props to children components
    const childWithProps = this.props.children.map((child) => {
      return cloneElement(child, {
        predictions: this.state.predictions,
        descSubfields: this.state.descSubfields,
        onClicked: this.handleSelectedPlace
      });
    });
    
    return (
      <form class={style.form} onSubmit={this.handleSubmit}>
        <input type='search' placeholder='Search for a place or address' class={style.search}
          onInput={this.handleChange}/>
        {childWithProps}
      </form>
    );
  }
}
