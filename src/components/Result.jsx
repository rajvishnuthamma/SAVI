
import { useNavigate } from "react-router-dom";
import "../styles/Result.css";

export default function Result() {

const navigate=useNavigate();

return(

<div className="result">

<h1>🤔 Was I Human or AI?</h1>

<p>
You talked with me.
Now make your guess.
</p>

<div className="btns">

<button
onClick={()=>alert("😄 Wrong! I was AI.")}
>
Human
</button>

<button
onClick={()=>alert("🎉 Correct! I was AI.")}
>
AI
</button>

</div>

<button
className="homeBtn"
onClick={()=>navigate("/")}
>
Home
</button>

</div>

);

}