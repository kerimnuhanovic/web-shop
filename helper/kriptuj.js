var CryptoJS = require("crypto-js");

exports.kriptuj = {
    kriptujTrgovca: function (rijec) {
        var hash = CryptoJS.HmacSHA1(rijec, "trgovacTajniKljuc");
        return hash.toString(CryptoJS.enc.Hex);
    },
    postaviTokenTrgovcu: function (rijec) {
        var hash = CryptoJS.HmacSHA1(rijec, "trgovacTajniKljuc");
        var obj = {
            username: rijec,
            hash: hash.toString(CryptoJS.enc.Hex)
        };
        return obj;
    },
    kriptujKupca: function (password) {
        var hash = CryptoJS.HmacSHA1(password, "kupacTajniKljuc");
        return hash.toString(CryptoJS.enc.Hex);
    },
    postaviTokenKupcu: function (username) {
        var hash = CryptoJS.HmacSHA1(username, "kupacTajniKljuc");
        var obj = {
            username: username,
            hash: hash.toString(CryptoJS.enc.Hex)
        };
        return obj;
    },
    kriptujAdministratora: function (password) {
        var hash = CryptoJS.HmacSHA1(password, "administratorTajniKljuc");
        return hash.toString(CryptoJS.enc.Hex);
    },
    postaviTokenAdministratoru: function (username) {
        var hash = CryptoJS.HmacSHA1(username, "administratorTajniKljuc");
        var obj = {
            username: username,
            hash: hash.toString(CryptoJS.enc.Hex)
        };
        return obj;
    }

};