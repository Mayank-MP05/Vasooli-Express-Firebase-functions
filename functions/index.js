const functions = require("firebase-functions");
const admin = require("firebase-admin");
var serviceAccount = require("./keys.json");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://vasoolimoney.firebaseio.com",
});

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
https://us-central1-vasoolimoney.cloudfunctions.net/listUsers
app.get("/", (request, response) => {
  admin
    .auth()
    .listUsers()
    .then((res) => {
      let usrArr = [];
      res.users.forEach((usr) => {
        usrArr.push(usr.email);
      });
      response.send(usrArr);
    })
    .catch((err) => {
      console.log(err);
    });
});

exports.listUsers = functions.https.onRequest((request, response) => {
  admin
    .auth()
    .listUsers()
    .then((res) => {
      let usrArr = [];
      res.users.forEach((usr) => {
        usrArr.push(usr.email);
      });
      response.send(usrArr);
    })
    .catch((err) => {
      console.log(err);
    });
});

exports.onUserCreated = functions.auth.user().onCreate((user) => {
  //Push the New User Creation Notif DB
  const db = admin.firestore();
  db.collection("notif")
    .add({
      private: false,
      content: `Hii ! ${user.email} just joined Vasooli Money Manager`,
      type: "INFO",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    .then((res) => console.log(res))
    .catch((err) => console.log(err));
});

exports.paymentInfo = functions.firestore
  .document("vasooli/{vasooliID}")
  .onUpdate((change, context) => {
    const db = admin.firestore();
    const newVal = change.after.data();
    const oldVal = change.before.data();
    let statusOld = oldVal.status;
    let statusNew = newVal.status;
    let obj = {
      private: true,
      user: oldVal.to,
      content: "",
      type: "PAYMENT",
      readStatus: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (statusOld === "WAITING" && statusNew === "APPROVED") {
      obj.content = `${oldVal.from} had APPROVED your payment`;
    } else if (statusOld === "WAITING" && statusNew === "DECLINED") {
      obj.content = `${oldVal.from} had REJECTED your payment`;
    } else if (statusOld === "WAITING" && statusNew === "PAID") {
      obj.content = `${oldVal.from} had given your $${oldVal.amount} back to you`;
    } else if (statusOld === "APPROVED" && statusNew === "PAID") {
      obj.content = `${oldVal.from} had given your $${oldVal.amount} back to you`;
    }
    db.collection("notif")
      .add(obj)
      .then()
      .catch((err) => console.log(err));
  });

// Update User Balance on Each transaction
exports.updateTransactionBalance = functions.firestore
  .document("transactions/{transID}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const newVal = snap.data();
    let amount = parseInt(newVal.amount);
    //updating balance in User Collection
    db.collection("users")
      .doc(newVal.user)
      .get()
      .then((obj) => {
        const user = obj.data();
        //Getting User balance
        let oldBal = parseInt(user.balance);
        console.log(newVal);
        console.log("amount : ", amount);
        console.log("Old Bal : ", amount);
        let newBal;

        let field = parseInt(user.category) + 1;

        if (newVal.type === "INC") {
          newBal = oldBal + amount;
        } else if (newVal.type === "EXP") {
          newBal = oldBal - amount;
        } else {
          newBal = oldBal;
        }

        console.log(newBal);
        db.collection("users")
          .doc(newVal.user)
          .set(
            {
              balance: newBal,
            },
            {
              merge: true,
            }
          )
          .then((res) => console.log(res))
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  });

// Update User Balance on Each Vasooli
exports.updateVasooliBalance = functions.firestore
  .document("vasooli/{vasooliID}")
  .onUpdate((change, context) => {
    const db = admin.firestore();
    const before = change.before.data();
    const after = change.after.data();
    let statusOld = before.status;
    let statusNew = after.status;
    let amount = parseInt(before.amount);
    let from = before.from;
    let to = before.to;
    let newBal;
    if (
      (statusOld === "WAITING" && statusNew === "PAID") ||
      (statusOld === "APPROVED" && statusNew === "PAID")
    ) {
      //Real Money Transfer Happen here
      db.collection("users")
        .where("email", "==", from)
        .get()
        .then((fromUser) => {
          console.log(fromUser);
          fromUser.forEach((u) => {
            const id = u.id;
            let oldBal = parseInt(u.data().balance);
            let newBal = oldBal + amount;
            db.collection("users").doc(id).set(
              {
                amount: newBal,
              },
              { merge: true }
            );
          });
        })
        .catch((err) => console.log(err));
      db.collection("users")
        .where("email", "==", to)
        .get()
        .then((toUser) => {
          console.log(toUser);
          toUser.forEach((u) => {
            const id = u.id;
            let oldBal = parseInt(u.data().balance);
            let newBal = oldBal - amount;
            db.collection("users").doc(id).set(
              {
                amount: newBal,
              },
              { merge: true }
            );
          });
        })
        .catch((err) => console.log(err));
    }
  });
exports.app = functions.https.onRequest(app);
