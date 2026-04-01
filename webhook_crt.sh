  curl -X POST https://merchant.revolut.com/api/1.0/webhooks \                                                           
    -H "Authorization: Bearer pk_DF5k4y16yeXQIT4DKvi2F4OJLWpYUQ8PVtvdbaEOZbuJhdo8" \           
    -H "Content-Type: application/json" \                                                                                
    -d '{
      "url": "https://perspectiva-evei.vercel.app/api/webhooks/revolut",                                                 
      "events": ["ORDER_COMPLETED", "ORDER_FAILED", "ORDER_CANCELLED"]                                                   
    }'
