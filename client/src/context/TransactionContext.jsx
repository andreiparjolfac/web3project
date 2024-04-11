import React,{useEffect,useState} from "react";
import {ethers} from "ethers";

import {contractABI,contractAddress} from "../utils/constants";

export const TransactionContext = React.createContext();

const {ethereum} = window;

const getEthereumContract = async () => {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const transactionContract = await new ethers.Contract(contractAddress,contractABI.abi,signer);
    return transactionContract;


}

export const TransactionProvider = ({children}) => {
    const [connectedAccount,setConnectedAccount] = useState("");
    const [formData,setFormData] = useState({addressTo:"",amount:"",message:"",keyword:""});
    const [isLoading,setIsLoading] = useState(false);
    const [transactionCount,setTransactionCount] = useState(localStorage.getItem("transactionCount"));
    
    const handleChange = (e,name) => {
        setFormData((prevState)=>({...prevState,[name]:e.target.value}));
    }

    const checkIfWalletIsConnected = async () => {

        try {
            
        if(!ethereum) return alert("Please Install Metamask!");

        const accounts = await ethereum.request({method:"eth_accounts"});

        if(accounts.length){
            setConnectedAccount(accounts[0]);

            //get all transactions
        }else{
            console.log("No accounts found!");
        }

        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object!");
        }
    }

    const connectWallet = async()=>{
        try {
            if(!ethereum) return alert("Please Install Metamask!");
            const accounts = await ethereum.request({method:"eth_requestAccounts"});
            setConnectedAccount(accounts[0]);


        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object!");
        }
    }

    const sendTransaction = async () => {
        try {
            if(!ethereum) return alert("Please Install Metamask!");
            const {addressTo,amount,keyword,message} = formData;


            const transactionContract = await getEthereumContract();
            const parsedAmount = ethers.parseEther(amount);

            await ethereum.request({
                method : "eth_sendTransaction",
                params : [{
                    from : connectedAccount,
                    to : addressTo ,
                    gas : '0x5208',
                    value : `0x${parsedAmount.toString(16)}`

                }] 
            });

            const transactionHash = await transactionContract.getFunction("addToBlockchain").call(null,addressTo,parsedAmount,message,keyword);
            setIsLoading(true);
            console.log(`Loading  `);
            await transactionHash.wait();
            setIsLoading(false);

            const transactionCount = await transactionContract.getFunction("getTransactionCount").call();
            setTransactionCount(parseInt(transactionCount));


        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object!");
        }
    }

    useEffect(()=>{
        checkIfWalletIsConnected();
    },[]);

    return (
        <TransactionContext.Provider value={{connectWallet,connectedAccount,formData,handleChange,sendTransaction}}>
            {children}
        </TransactionContext.Provider>
    );
}
