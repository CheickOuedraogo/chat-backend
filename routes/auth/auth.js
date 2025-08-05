import jwt from "jsonwebtoken";
import 'dotenv/config.js'

const auth = (req, res, next) => {
  const token =
    req.signedCookies?.token || req.headers["authorization"]?.trim().split(" ")[1] || null;
    console.log(token);
    if (!token)
        return res.status(401).json({error: "token manquant"})
    const isValide = jwt.verify(token,process.env.JWT)
    if(!isValide)
        return res.status(401).json({error: "token invalide"})
    req.id = jwt.decode(token).id;
    console.log('le token est bon');
    next()
};





const generateToken = ({id, username})=>{
    const payload = 12
    const token = jwt.sign({id,username},process.env.JWT,{expiresIn: '24h'})
    return token
}

export {auth, generateToken}