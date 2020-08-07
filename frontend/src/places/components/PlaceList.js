import React, { useContext } from "react";

import Card from "../../shared/components/UIElements/Card";
import Button from "../../shared/components/FormElements/Button";
import PlaceItem from "./PlaceItem";
import { AuthContext } from "../../shared/context/auth-context";
import "./PlaceList.css";

const PlaceList = (props) => {
  const auth = useContext(AuthContext);

  if (props.items.length === 0) {
    return (
      <div className="place-list center">
        <Card>
          {auth.userId === props.forUserId && <h2>No places found. Maybe create one?</h2>}
          {auth.userId === props.forUserId && <Button to="/places/new">Share Place</Button>}
          {auth.userId !== props.forUserId && <h2>No places found yet. Maybe come back later?</h2>}
        </Card>
      </div>
    );
  }

  return (
    <ul className="place-list">
      {props.items.map((place) => {
        return (
          <PlaceItem
            key={place.id}
            id={place.id}
            image={place.image}
            title={place.title}
            description={place.description}
            address={place.address}
            creatorId={place.creator}
            coordinates={place.location}
            onDelete={props.onDeletePlace}
          />
        );
      })}
    </ul>
  );
};

export default PlaceList;
