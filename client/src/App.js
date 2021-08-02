import React, { useState } from "react";
import "./App.css";
import axios from "axios";
import Cookies from "js-cookie";

function App() {
    const [user, setUser] = useState({});
    const [err, setErr] = useState("");

    const on_refresh = refreshToken => {
        console.log("Refreshing token!");

        return new Promise((resolve, reject) => {
            axios
                .post("http://localhost:5000/refresh", { token: refreshToken })
                .then(data => {
                    if (data.data.success === false) {
                        setErr("Login again");
                        // set message and return.
                        resolve(false);
                    } else {
                        const { accessToken } = data.data;
                        Cookies.set("access", accessToken);
                        console.log("refreshed new access token -->", accessToken);
                        resolve(accessToken);
                    }
                });
        });
    };

    const access_protected_data = async (accessToken, refreshToken) => {
        // console.log(accessToken, refreshToken);

        return new Promise((resolve, reject) => {
            axios
                .post(
                    "http://localhost:5000/protected",
                    {},
                    { headers: { authorization: `Bearer ${accessToken}` } }
                )
                .then(async data => {
                    console.log("ACCESS AUTH RES", data)
                    if (data.data.success === false) {

                        if (data.data.message === "User not authenticated") {
                            setErr("Login again");
                            // set err message to login again.
                        } else if (data.data.message === "Access token expired") {
                            // const accessToken = await on_refresh(refreshToken);
                            // return await access_protected_data(
                            //     accessToken,
                            //     refreshToken
                            // );
                            console.log("Access token expired")
                            setErr("Protected route cannot be accessed!");
                        }

                        resolve(false);
                    } else {
                        console.log("Protected route accessed!")
                        // protected route has been accessed, response can be used.
                        setErr("Protected route accessed!");
                        resolve(true);
                    }
                });
        });
    };

    const handleChange = e => {
        setUser({ ...user, [e.target.name]: e.target.value });
        // console.log(user);
    };

    const on_login = e => {
        e.preventDefault();
        console.log("user data before login ", user)
        if (Object.keys(user).length !== 0 ) {
            axios.post("http://localhost:5000/login", { user }).then(data => {
                const { accessToken, refreshToken } = data.data;

                Cookies.set("access", accessToken);
                Cookies.set("refresh", refreshToken);

                console.log("fresh access token -->", accessToken);
                console.log("fresh refresh token -->", refreshToken);
                on_refresh(refreshToken);
            });
        }else{
            console.log("enter details")
        }


    };

    const hasAccess = async (accessToken, refreshToken) => {
        if (!refreshToken) return null;

        if (accessToken === undefined) {
            // generate new accessToken
            accessToken = await on_refresh(refreshToken);
            return accessToken;
        }

        return accessToken;
    };

    const on_protect = async e => {
        let accessToken = Cookies.get("access");
        let refreshToken = Cookies.get("refresh");

        accessToken = await hasAccess(accessToken, refreshToken);

        if (!accessToken) {
            // Set message saying login again.
            console.log("**LOGIN AGAIN!**")
        } else {
            await access_protected_data(accessToken, refreshToken);
        }
    };

    return (
        <div className="App">
            <form action="" onChange={handleChange} onSubmit={ on_login}>
                <input name="email" type="email" placeholder="Email address" />
                <br />
                <br />

                <input name="password" type="password" placeholder="Password" />
                <br />
                <br />
                <input type="submit" value="Login" />
                <br />
                <br />
            </form>
            <test style={{ color: err == "Protected route accessed!"?"green":"red"}}>{err}</test>
            
            <br/>
            <button onClick={on_protect}>Access Protected Content</button>
            <br/> <br/>

            <button onClick={() => { on_refresh(Cookies.get("refresh")) }}>Refresh tokens</button>
        </div>
    );
}

export default App;
