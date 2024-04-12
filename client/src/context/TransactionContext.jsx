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
    const [transactions,setTransactions] = useState([]);
    const handleChange = (e,name) => {
        setFormData((prevState)=>({...prevState,[name]:e.target.value}));
    }

    const getAllTransactions = async () => {
        try {
            if(!ethereum) return alert("Please Install Metamask!");
            const transactionContract = await getEthereumContract();
            const rawTransactions = await transactionContract.getFunction("getAllTransactions").call();
            let structured_transactions = [];
            for(let i=0;i<transactionCount;i++){
                
                structured_transactions.push({
                    addressFrom:rawTransactions[i][0],
                    addressTo:rawTransactions[i][1],
                    amount:parseInt(rawTransactions[i][2])/Math.pow(10,18),
                    message:rawTransactions[i][3],
                    timestamp:new Date(Number(rawTransactions[i][4])*1000).toLocaleString(),
                    keyword:rawTransactions[i][5]
                })
            }

            setTransactions(structured_transactions);

        } catch (error) {
            console.error(error);
        }
    }

    const checkIfWalletIsConnected = async () => {

        try {
            
        if(!ethereum) return alert("Please Install Metamask!");

        const accounts = await ethereum.request({method:"eth_accounts"});

        if(accounts.length){
            setConnectedAccount(accounts[0]);

            
        }else{
            console.log("No accounts found!");
        }

        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object!");
        }
    }

    const checkIfTransactionsExists = async () => {
        try {
            const transactionContract = await getEthereumContract();
            const count = parseInt(await transactionContract.getFunction("getTransactionCount").call());
            window.localStorage.setItem("transactionCount",count);
            setTransactionCount(count);
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
            
            setIsLoading(true);
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
            
            console.log(`Loading  `);
            await transactionHash.wait();
            setIsLoading(false);

            const transactionCount = await transactionContract.getFunction("getTransactionCount").call();
            setTransactionCount(parseInt(transactionCount));

            setFormData({addressTo:"",amount:"",message:"",keyword:""});
            getAllTransactions();

        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object!");
        }
    }

    useEffect(()=>{
        checkIfWalletIsConnected();
        checkIfTransactionsExists();
        getAllTransactions();
    },[]);

    return (
        <TransactionContext.Provider value={{connectWallet,connectedAccount,formData,handleChange,sendTransaction,isLoading,transactions}}>
            {children}
        </TransactionContext.Provider>
    );
}
