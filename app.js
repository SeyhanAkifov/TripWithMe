

let errorBox = document.getElementsByClassName('notification errorBox')[0];
let successBox = document.getElementsByClassName('notification infoBox')[0];
let loading = document.getElementsByClassName('notification loadingBox')[0];

const router = Sammy('#container', function () {

    this.use('Handlebars', 'hbs');

    this.get('/', async function (context) {
        context.redirect('/home')
    });

    this.get('/home', async function (context) {

        checkAuth(context);
        
        loading.textContent = "Loading...";
        loading.style.display = "inline-block";

        await fetch('https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/.json')

            .then(response => response.json())
            .then(data => {

                if (data) {
                    context.trips = Object.keys(data).map(key => ({ key, ...data[key] }));
                    console.log(context.trips);
                 }
            })
            
            await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            'trip' : './templates/catalog/trip.hbs',
            'search' : './templates/search/search.hbs'
            
        }).then(function () {
            this.partial('../templates/catalog/home.hbs')
        }).then(loading.style.display = "none")

    });

    this.get('/login', async function (context) {

        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/login/login.hbs')
        })
    });

    this.post('/login', function (context) {


        const { email, password } = context.params

        if (!email || !password) {
            return
        }
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userInfo) => {
                localStorage.setItem('userInfo', JSON.stringify({ uid: userInfo.user.uid, email: userInfo.user.email }));
                context.redirect('/home')
                showMessage(successBox, "Login successful.");
            })
            .catch(function (error) {
                
                var errorCode = error.code;
                var errorMessage = error.message;
                showMessage(errorBox, error.message);
            });
    });

    this.get('/register', async function (context) {

        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/register/register.hbs')
        })
    });

    this.post('/register', function (context) {
        const { email, password, rePassword } = context.params;

        if (!email || !password || !rePassword) {
            showMessage(errorBox, "Invalid inputs");
            return
        }
        if (password !== rePassword) {

            showMessage(errorBox, "Passwords doesnt match");
            return;
        }
        console.log(context)

        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((createdUser) => {
                context.redirect('/login')
                showMessage(successBox, "User registration successful.");
            })
            .catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                showMessage(errorBox, errorMessage);  
                
        });
    });

    this.get('/logout', function (context) {
        console.log(context)
        firebase.auth().signOut()
            .then(function () {
                localStorage.removeItem('userInfo');
                context.loggedIn = false
                context.redirect('/home');
                showMessage(successBox, "Logout successful");
            }).catch(function (error) {
                showMessage(errorBox, error.message);
            })

    });

    this.get('/create', async function (context) {

        checkAuth(context);

        if (!context.loggedIn) {
            context.redirect('/')
        }

        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/create/create.hbs')
        })
    });

    this.post('/create',  function (context) {

        checkAuth(context);
        const { firstName, lastName, title, description, destinationFrom, destinationTo, date, persons } = context.params;


        if (!firstName || !lastName || !destinationFrom || !destinationTo || !date || !persons) {
            showMessage(errorBox, "All input fields shouldn’t be empty")
            return
        }
        
        if(persons < 1 || persons > 25) {
            showMessage(errorBox, 'Duration must be between 1…100');
            return
        }

        loading.textContent = "Loading...";
        loading.style.display = "inline-block";
        fetch('https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/.json',
            {
                method: "POST",
                body: JSON.stringify({
                    firstName, 
                    lastName, 
                    title,
                    description,
                    destinationFrom, 
                    destinationTo, 
                    date, 
                    persons,
                    creator: context.email,
                    joined : ['dryhsn']

                })
            })
            .then(loading.style.display = "none")
            .then(showMessage(successBox, 'Successfuly created destination'))
            .then(async () => await context.redirect('/home'))

        


    });

    this.get('/edit/:id', async function (context) {

        checkAuth(context);

        if (!context.loggedIn) {
            context.redirect('/')
        }

        await fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`)

            .then(response => response.json())
            .then(data => {

                if (data) {
                    context.trip = data;
                    
                    context.trip.filter
                    context.left = data.persons - data.joined.length
                    context.isAuthor = data.creator == context.email ? true : undefined
                    context.isJoined = data.joined.includes(context.email) ? true : undefined
                    
                 }
            })
            context.key = context.params.id
            console.log(context);
            await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
            
            
        }).then(function () {
            this.partial('../templates/edit/edit.hbs')
        }).then(loading.style.display = "none")
    });


    this.get('/editTrip/:id', async function(context){
        checkAuth(context);
        const { firstName, lastName, destinationFrom, destinationTo, date, persons } = context.params;


        if (!firstName || !lastName || !destinationFrom || !destinationTo || !date || !persons) {
            showMessage(errorBox, "All input fields shouldn’t be empty")
            return
        }
        
        if(persons < 1 || persons > 25) {
            showMessage(errorBox, 'Duration must be between 1…100');
            return
        }

        loading.textContent = "Loading...";
        loading.style.display = "inline-block";
        fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    firstName : firstName, 
                    lastName : lastName,
                    destinationFrom : destinationFrom, 
                    destinationTo : destinationTo, 
                    date : date, 
                    persons : persons,
                   
                })
            })
            .then(loading.style.display = "none")
            .then(showMessage(successBox, 'Successfuly created destination'))
            .then(async () => await context.redirect('/home'))
    })

    this.get('/myTrips', async function (context){

        checkAuth(context);
        
        loading.textContent = "Loading...";
        loading.style.display = "inline-block";

        await fetch('https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/.json')

            .then(response => response.json())
            .then(data => {

                if (data) {
                    context.trips = Object.keys(data).map(key => ({ key, ...data[key] })).filter(data => data.creator == context.email);
                    console.log(context.trips);
                    context.trips.filter
                 }
            })
            
            await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            'trip' : './templates/catalog/trip.hbs',
            'search': './templates/search/search.hbs'
            
        }).then(function () {
            this.partial('../templates/catalog/home.hbs')
        }).then(loading.style.display = "none")
    })

    this.get('/details/:id', async function(context) {
        checkAuth(context);
        
        loading.textContent = "Loading...";
        loading.style.display = "inline-block";

        await fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`)

            .then(response => response.json())
            .then(data => {

                if (data) {
                    context.trip = data;
                    
                    context.trip.filter
                    context.left = data.persons - data.joined.length
                    context.isAuthor = data.creator == context.email ? true : undefined
                    context.isJoined = data.joined.includes(context.email) ? true : undefined
                    
                 }
            })
            context.key = context.params.id
            console.log(context);
            await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
            
            
        }).then(function () {
            this.partial('../templates/details/details.hbs')
        }).then(loading.style.display = "none")
    })

    this.get('/delete/:id', async function(context) {
        checkAuth(context);
        
        loading.textContent = "Loading...";
        loading.style.display = "inline-block";
        console.log(context);
        await fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`, {
            method: "DELETE"
        
            
        }).then(loading.style.display = "none")

        context.redirect('/')
    })

    this.get('/myJoined', async function (context){

        checkAuth(context);
        
        loading.textContent = "Loading...";
        loading.style.display = "inline-block";

        await fetch('https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/.json')

            .then(response => response.json())
            .then(data => {

                if (data) {
                    context.trips = Object.keys(data).map(key => ({ key, ...data[key] })).filter(data => data.joined.includes(context.email));
                    console.log(context.trips);
                    context.trips.filter
                 }
            })
            
            await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            'trip' : './templates/catalog/trip.hbs',
            'search': './templates/search/search.hbs'
            
        }).then(function () {
            this.partial('../templates/catalog/home.hbs')
        }).then(loading.style.display = "none")
    })

    this.get('/search', async function (context){
        const { from, to } = context.params;
        
        checkAuth(context);
        console.log(context);
        loading.textContent = "Loading...";
        loading.style.display = "inline-block";

        await fetch('https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/.json')

            .then(response => response.json())
            .then(data => {

                if (data) {
                    context.trips = Object.keys(data).map(key => ({ key, ...data[key] }))
                    .filter(data => (from ? data.destinationFrom == from : data.destinationFrom) && (to ? data.destinationTo == to : data.destinationTo));
                    console.log(context.trips);
                    context.trips.filter
                 }
            })
            
            await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            'trip' : './templates/catalog/trip.hbs',
            'search': './templates/search/search.hbs'
            
        }).then(function () {
            this.partial('../templates/catalog/home.hbs')
        }).then(loading.style.display = "none")
    })

    this.get('/all', async function (context){

        checkAuth(context);
        
        loading.textContent = "Loading...";
        loading.style.display = "inline-block";

        await fetch('https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/.json')

            .then(response => response.json())
            .then(data => {

                if (data) {
                    context.trips = Object.keys(data).map(key => ({ key, ...data[key] }));
                    console.log(context.trips);
                    context.trips.filter
                 }
            })
            
            await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            'trip' : './templates/catalog/trip.hbs',
            'search': './templates/search/search.hbs'
            
        }).then(function () {
            this.partial('../templates/catalog/home.hbs')
        }).then(loading.style.display = "none")
    })

    this.get('/join/:id', async function (context) {

        checkAuth(context);

        
        
       let myData = [];

        console.log(context.params.id);
        const item  = await fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`)
        .then( (response) => response.json())
       


        let left  = item.persons - item.joined.length

        if (item.persons < item.joined.length + 1) {
            context.redirect('/home')
            return
        }
        console.log(context);
        console.log(item);
        console.log(item.joined.length);
        item.joined.push(context.email);
        await fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`,
        {
            method:'PATCH',
            body : JSON.stringify({
                firstName : item.firstName, 
                    lastName : item.lastName,
                    destinationFrom : item.destinationFrom, 
                    destinationTo : item.destinationTo, 
                    date : item.date, 
                    persons : item.persons,
                    creator: item.email,
                    joined : item.joined
            })

        })
        .then(async () => await context.redirect('/home'))
    });
        
    this.get('/unJoin/:id', async function (context) {

        checkAuth(context);

        
        
       let myData = [];

        console.log(context.params.id);
        const item  = await fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`)
        .then( (response) => response.json())
       


        let left  = item.persons - item.joined.length

        
        console.log(context);
        console.log(item);
        console.log(item.joined.length);
        item.joined = item.joined.filter( item => item != context.email);
        await fetch(`https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/${context.params.id}.json`,
        {
            method:'PATCH',
            body : JSON.stringify({
                firstName : item.firstName, 
                    lastName : item.lastName,
                    destinationFrom : item.destinationFrom, 
                    destinationTo : item.destinationTo, 
                    date : item.date, 
                    persons : item.persons,
                    creator: item.email,
                    joined : item.joined
            })

        })
        .then(async () => await context.redirect('/home'))
    });
    

    function checkAuth(context) {

        if (localStorage.userInfo) {
            const { uid, email } = JSON.parse(localStorage.userInfo)
            context.loggedIn = true;
            context.uid = uid;
            context.email = email;
        };
    };

    function showMessage(type, message) {


        type.textContent = message;
        type.style.display = "inline-block";


        setTimeout(() => {
            type.style.display = "none"
        }, 3000)


    };
});

(() => {
    router.run();
})()