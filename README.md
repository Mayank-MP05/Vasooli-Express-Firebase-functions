# Vasooli-Express-Firebase-functions
All the Cloud firebase function for the Front End of the React-Firebase Made Vasooli App

Using NoSQL database has its own benefits one of the major advantage is loose schema for NoSQL database like Firebase here is the Database Schema of this project

## 4 Major Collections : 

1.  users
2.  transactions
3.  vasooli
4.  notif

```
- User.id is Primary Key
user : {
  address,
  balance,
  email,
  fullName,
  profilePic
}
```

```
transaction : {
    amount,
    category,
    date,
    desc:"Description",
    type:"INC","EXP",
    user: user.id,
}
```

```
vasooli : {
  amount,
  category,
  date,
  desc,
  from:email,
  to:email,
  status: "PAID","APPROVED","DECLINED"
}
```
```
notif : {
  content ,
  private : true/false,
  timestamp,
  type
}
```
