

export const displayMap= locations=>{

  mapboxgl.accessToken = 'pk.eyJ1IjoiYXNoaXI2NTUiLCJhIjoiY2w4aW9tbnoyMDBzdzN4a2wzMXR4Yjg0NiJ9.qEcz1qsfLJ1EsUvakimd1w';
    var map = new mapboxgl.Map({
      container: 'map', // will put in id map which we already had in our pugs else we can also change name here to other id.
      style: 'mapbox://styles/ashir655/cl8it793h001814pp516oayzg',
      scrollZoom:false // to stop scrolling the map but still can pan it
      // center:[-118.113491,34.111745],
      // zoom:3,
      // interactive:false // to stop panning along with scrolling zooming etc ie: maps behave like picture
    });


    const bounds= new mapboxgl.LngLatBounds(); //make a bound obj to further down the line set map display such that all locations are visible. 

    // locations.forEach(loc => {
    //     //Create marker using html & css
        // const mark_spot=document.createElement('div');
        // mark_spot.className='marker';

    //     //Add to mapbox map
    //     new mapboxgl.Marker({
    //       element:mark_spot, // give marker to mapbox to use it.
    //       anchor:'bottom'    // tell it which point of marker should point to the coordinates.
    //     }).setLngLat(loc.coodinates).addTo(map); // set coords and add to map finally

    //     bounds.extend(loc.coordinates); // set bounds to include all locations.
    // });
        // const loc_arr=locations[0].coordinates;
        // console.log(loc_arr)
        // const mark_spot=document.createElement('div');
        // mark_spot.className='marker';
        // new mapboxgl.Marker({
        //         element:mark_spot, // give marker to mapbox to use it.
        //         anchor:'bottom'    // tell it which point of marker should point to the coordinates.
        //       }).setLngLat(locations[1].coordinates).addTo(map);
        //       bounds.extend(locations[1].coordinates)
        //       // bounds.extend([-118.113491,34.111745])
        const mark_spot=document.createElement('div');
        mark_spot.className='marker';

        locations.forEach(element => {
          const mark_spot=document.createElement('div');
          mark_spot.className='marker';


          new mapboxgl.Marker({
            element:mark_spot, // give marker to mapbox to use it.
            anchor:'bottom'    // tell it which point of marker should point to the coordinates.
          }).setLngLat(element.coordinates).addTo(map);

          new mapboxgl.Popup({offset:30})
          .setLngLat(element.coordinates)
          .setHTML(`<p>Day ${element.day}: ${element.description}</p>`).addTo(map)


          bounds.extend(element.coordinates)
        });

    map.fitBounds(bounds,{
      padding:{
        top:200, bottom:100, left:50, right:50
      }
    });
}