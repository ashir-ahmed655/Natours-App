class APIFeatures{
    constructor(query,queryString){
        this.query=query;
        this.queryString=queryString;
    }
    filter(){ // ^Filtering         
        // console.log(queryString);  // gives the query/optional arguments back to us ie args starting with ? in url in object form
        const queryCopy={...this.queryString}; // Makes a hard copy of req.query
        const exclude_From_Query=['page','sort','limit','fields'];
        exclude_From_Query.forEach(ele=>{ delete queryCopy[ele]}); // deletes properties present in array from query obj
        // console.log(queryCopy);  
        
        //^ Advanced Filtering
        /*We can't just use equal operator ie: difficulty=easy, so in order to use lt(less than),lte,gt,gte We have to define the url in a special way
        like this: 127.0.0.1:6969/api/v1/tours?difficulty[lte]=easy which would effectively make opt-param a value of property named lte in difficulty obj
        and the MongoDb way of querying opt-param with all these inequalities was: tour.find({'difficulty':{$lte:'easy'}}). Hence above stuff should start
        to make sense now.Now we just have to append a $ sign with the query obj to implement inequality filtering...
        */
        let queryJson=JSON.stringify(queryCopy); // since it is in string form now use regex to replace lt with $lt....
        // here g is globl, b is to match only this string exactly to avoid match of words like guilt with lt at end...
        queryJson=queryJson.replace(/\b(gte|gt|lt|lte)\b/g,matchedWord =>{ //replace also accepts callback with param which has matched word/string in it
            return "$"+matchedWord });// returns $lt (if matchedWord was lt ) 
        // console.log(JSON.parse(queryString)); // returns inequals replaced with $inequals: lt=>$lt
        this.query=this.query.find(JSON.parse(queryJson)); // returned mongoose obj without await becuz: we might have to attach methods like sort with it.
        return this;
    }
    sort(){
        if(this.queryString.sort){ // returns 
            // console.log(req.query.sort) //shows the value of sort parameter in req.query ie:price but query.sort can also take two params separated by space
            // The 2nd param will be used in-case of tie for the 1st param but can't pass 2nd param with space in url so pass there with comma and replace here
            const space_separated=this.queryString.sort.replace(',',' ');
            // console.log(space_separated);
            this.query= this.query.sort(space_separated) // query has a method to automatically sort 
        }else{
            this.query=this.query.sort('name'); // return name sorted in ascending by default, if want descending prefix '-' with name ie: -name
        }
        return this;
    }
    limitfield(){
        if(this.queryString.fields){
            // console.log(req.query.fields);
            const space_separated=this.queryString.fields.replaceAll(","," ");
            // console.log(space_separated);
            this.query=this.query.select(space_separated);
        }else{
            this.query=this.query.select('-__v') // removed id & this internal var of mongodb called __v by default
        }
        return this;
    }
    paginate(){
        // we use query.page & query.limit where in page the page number would be passed & in limit the no.of results on 1 page
    const page=this.queryString.page*1 || 1; // either page in Number format or default is 1
    const limit=this.queryString.limit*1 || 100;
    const skip_Till= (page-1)*limit;
    this.query=this.query.skip(skip_Till).limit(limit);

    return this; 
    }
}

module.exports=APIFeatures;